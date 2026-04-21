# Email Marketing System (Brevo)

## Overview
Email marketing is managed via **Brevo** (formerly Sendinblue). Used for onboarding emails, institutional guide distribution, and periodic newsletters.

## Current Templates
- **Welcome Email**: Triggered on new user registration. Contains: welcome message, dashboard link, 7-day trial info.
- **Institutional Guide Delivery**: Sends `ZenPips_Institutional_Guide.pdf` as attachment after onboarding.
- **Signal Alert** (planned): Automated email when a new high-confidence signal is placed.

## Scripts
| Script | Purpose |
|---|---|
| `push_guide_to_brevo.py` | Uploads PDF guide to Brevo for template attachment |
| `push_welcome_to_brevo.py` | Configures welcome email template |
| `activate-brevo-template.mjs` | Activates a Brevo template |
| `update-brevo-template.mjs` | Updates template HTML |
| `check-brevo-status.mjs` | Checks delivery status |
| `list-brevo-templates.mjs` | Lists all configured templates |

## Email Flow
1. User registers on platform → Supabase auth triggers webhook.
2. `/api/leads` captures the lead data.
3. Brevo API sends welcome email with institutional guide PDF attached.
4. 3 days later: follow-up email with community invitation link.
5. 7 days later: trial expiration reminder with subscription CTA.

## Tags
#Email #Brevo #Marketing #Onboarding #Newsletter
