"""Réglages communs : Home Assistant de test, avec les intégrations personnalisées permises."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def auto_enable_custom_integrations(enable_custom_integrations):
    """Laisse Home Assistant charger custom_components/automatic_dashboard."""
    return
