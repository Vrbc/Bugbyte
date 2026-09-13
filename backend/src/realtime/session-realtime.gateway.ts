import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserRole } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import type { JoinSessionDto } from './dto/join-session.dto';
import type { JoinCampaignTimelineDto } from './dto/join-campaign-timeline.dto';

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};

type SocketUser = {
  id: string;
  role: UserRole;
};

type AppSocket = Omit<Socket, 'data'> & {
  data: { authPromise: Promise<SocketUser | null> };
};

type JoinSessionResponse = {
  success: boolean;
  message?: string;
};

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL ?? 'http://localhost:4200',
    credentials: true,
  },
})
export class SessionRealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(SessionRealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  handleConnection(client: AppSocket): void {
    client.data.authPromise = this.authenticateSocket(client);
    void client.data.authPromise.then((user) => {
      if (!user) {
        client.disconnect(true);
      }
    });
  }

  private async authenticateSocket(
    client: AppSocket,
  ): Promise<SocketUser | null> {
    try {
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        throw new Error('Missing auth token.');
      }

      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new Error('User is not active or does not exist.');
      }

      return { id: user.id, role: user.role };
    } catch (error) {
      this.logger.warn(
        `Rejected WebSocket connection: ${(error as Error).message}`,
      );
      return null;
    }
  }

  handleDisconnect(client: AppSocket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinSession')
  async handleJoinSession(
    @MessageBody() dto: JoinSessionDto,
    @ConnectedSocket() client: AppSocket,
  ): Promise<JoinSessionResponse> {
    if (!dto?.sessionId || typeof dto.sessionId !== 'string') {
      return { success: false, message: 'A valid sessionId is required.' };
    }

    const user = await client.data.authPromise;
    if (!user) {
      return { success: false, message: 'Not authenticated.' };
    }

    const session = await this.prisma.testSession.findFirst({
      where: {
        id: dto.sessionId,
        OR: [{ testerId: user.id }, { campaign: { developerId: user.id } }],
      },
      select: { id: true },
    });

    if (!session) {
      return {
        success: false,
        message: 'You do not have access to this session.',
      };
    }

    await client.join(this.roomName(dto.sessionId));
    return { success: true };
  }

  @SubscribeMessage('leaveSession')
  async handleLeaveSession(
    @MessageBody() dto: JoinSessionDto,
    @ConnectedSocket() client: AppSocket,
  ): Promise<void> {
    if (!dto?.sessionId || typeof dto.sessionId !== 'string') {
      return;
    }

    await client.leave(this.roomName(dto.sessionId));
  }

  @SubscribeMessage('joinCampaignTimeline')
  async handleJoinCampaignTimeline(
    @MessageBody() dto: JoinCampaignTimelineDto,
    @ConnectedSocket() client: AppSocket,
  ): Promise<JoinSessionResponse> {
    if (!dto?.campaignId || typeof dto.campaignId !== 'string') {
      return { success: false, message: 'A valid campaignId is required.' };
    }

    const user = await client.data.authPromise;
    if (!user) {
      return { success: false, message: 'Not authenticated.' };
    }

    const campaign = await this.prisma.playtestCampaign.findFirst({
      where: { id: dto.campaignId, developerId: user.id },
      select: { id: true },
    });

    if (!campaign) {
      return {
        success: false,
        message: 'You do not have access to this campaign.',
      };
    }

    await client.join(this.campaignRoomName(dto.campaignId));
    return { success: true };
  }

  @SubscribeMessage('leaveCampaignTimeline')
  async handleLeaveCampaignTimeline(
    @MessageBody() dto: JoinCampaignTimelineDto,
    @ConnectedSocket() client: AppSocket,
  ): Promise<void> {
    if (!dto?.campaignId || typeof dto.campaignId !== 'string') {
      return;
    }

    await client.leave(this.campaignRoomName(dto.campaignId));
  }

  broadcastNewFeedback(
    sessionId: string,
    feedbackByte: Record<string, unknown>,
  ): void {
    this.server
      .to(this.roomName(sessionId))
      .emit('feedbackByte:new', feedbackByte);
  }

  broadcastSessionStatus(
    sessionId: string,
    session: Record<string, unknown>,
  ): void {
    this.server.to(this.roomName(sessionId)).emit('session:updated', session);
  }

  broadcastCampaignTimelineChanged(campaignId: string): void {
    this.server
      .to(this.campaignRoomName(campaignId))
      .emit('campaignTimeline:changed');
  }

  private roomName(sessionId: string): string {
    return `session:${sessionId}`;
  }

  private campaignRoomName(campaignId: string): string {
    return `campaign:${campaignId}`;
  }
}
