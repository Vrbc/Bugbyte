import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../../shared/ui/logo/logo';
import { Card } from '../../../shared/ui/card/card';
import { StatusBadge } from '../../../shared/ui/status-badge/status-badge';
import { buttonClasses } from '../../../shared/ui/button/button';

interface HowItWorksStep {
  icon: string;
  title: string;
  description: string;
}

const STEPS: HowItWorksStep[] = [
  {
    icon: 'campaign',
    title: 'Launch a campaign',
    description: 'Upload a build, set what you need tested, and publish a playtest campaign in minutes.',
  },
  {
    icon: 'sports_esports',
    title: 'Testers get playing',
    description: 'Testers browse open campaigns, apply, and start a live session the moment they’re accepted.',
  },
  {
    icon: 'podcasts',
    title: 'Feedback bytes, live',
    description: 'Every bug, suggestion and reaction streams in as a feedback byte, per tester or combined.',
  },
];

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Logo, Card, StatusBadge],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class Landing {
  protected readonly steps = STEPS;
  protected readonly primaryLinkClasses = buttonClasses('primary');
  protected readonly secondaryLinkClasses = buttonClasses('secondary');
}
