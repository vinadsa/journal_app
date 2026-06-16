# Project Context

## Product

Work Journal & Achievement Tracking System

This is NOT a diary application.
This is NOT a KPI tracker.
This is NOT a task manager.

The application solves:

* Contribution Amnesia
* Recency Bias
* Invisible Work
* Lack of Evidence

The primary goal is helping professionals build a documented, evidence-based history of their work contributions.

## Design Philosophy

Prioritize:

* Professional Memory System
* Personal Career Archive
* Premium product feel
* Distinctive visual identity

Avoid:

* Generic SaaS dashboards
* Bootstrap aesthetics
* Notion clones
* Enterprise ugliness

## Core Entities

* Journals
* Achievements
* Tags
* KPI Periods
* Teams

Journal entries are evidence capture.

Achievements are first-class citizens and should be prominently surfaced.

## Agent Workflow

When making frontend changes:

1. Use Playwright MCP to validate flows.
2. Use Chrome DevTools MCP to inspect failures.
3. Fix issues autonomously.
4. Retest after every fix.
5. Continue until flows pass.

Do not stop after finding the first bug.
