# Critical Hit System Analysis & Fixes

## Executive Summary
**Status**: Both crit chance and crit damage are broken due to incorrect stat reading in projectile creation.
**Root Cause**: BaseWeapon.createProjectile() reads from player.statsComponent instead of player.statSystem
**Impact**: No crits ever occur regardless of stat values

---

## Current System Architecture

### Stat Flow (Expected)

