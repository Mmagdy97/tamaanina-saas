# **App Name**: Tamaanina

## Core Features:

- Consolidated Health Dashboard: A high-level overview featuring key performance indicators, active child therapy cases, and therapist utilization rates.
- Pediatric Case Management: Comprehensive CRUD system to manage children's profiles, including session history and clinical milestones stored in Firestore.
- Clinician Directory: Secure management interface to onboard, edit, and offboard therapists with role-based visibility controls.
- AI Insight Tool: An AI tool that reasons through clinical session notes to generate compassionate, parent-friendly summaries and progress highlights.
- Secure Role-Based Authentication: Firebase-powered identity management providing tailored dashboard views for Admins, Therapists, and Parents.
- Live Attendance Stream: A real-time listener observing Firestore collections to provide live updates of therapist availability and session check-ins.
- Growth Tracker UI: Visual data representations and interactive charts to monitor children's progress over multi-month therapy blocks.

## Style Guidelines:

- The primary color is a calm and professional Midnight Lavender (#4A5BB5), chosen to evoke trust and stability within a light scheme.
- The background color is a tinted Ghost White (#F4F5FA), providing a subtle hint of the primary hue at very low saturation for a high-end feel.
- The accent color is a bright Cloud Blue (#7EB3D8), offering a 30-degree hue shift to provide refreshing contrast for action items.
- Font pairing: 'Alegreya' (Serif) for headlines to convey human warmth and empathy, paired with 'Inter' (Sans-serif) for tabular data and form controls to ensure modern objectivity.
- Soft-edged, dual-tone icons that use the Midnight Lavender palette to maintain clinical precision without feeling cold.
- A sidebar-centric navigation with card-based modular containers, utilizing ample negative space to reduce cognitive load for busy administrators.
- Sophisticated micro-interactions using eased-in transitions for dashboard metrics when data is refreshed from Firestore.