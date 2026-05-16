"""Targeted serializer default hardening tests for pledge flows."""

import uuid

from django.test import TestCase

from apps.jewellery.models.pledge import LoanRepayment, PledgeItem
from apps.jewellery.serializers.pledge import CreateRepaymentSerializer, PledgeItemWriteSerializer


class PledgeSerializerDefaultTests(TestCase):
    def test_pledge_item_write_serializer_uses_model_description_default(self):
        serializer = PledgeItemWriteSerializer(data={
            "metal": str(uuid.uuid4()),
            "purity": str(uuid.uuid4()),
            "gross_wt": "10.0000",
            "net_wt": "9.5000",
            "valuation_rate": "6200.0000",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data["description"],
            PledgeItem._meta.get_field("description").default,
        )

    def test_create_repayment_serializer_uses_model_reference_default(self):
        serializer = CreateRepaymentSerializer(data={
            "principal_paid": "5000.00",
            "interest_paid": "200.00",
            "mode": "CASH",
        })
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(
            serializer.validated_data["reference"],
            LoanRepayment._meta.get_field("reference").default,
        )
