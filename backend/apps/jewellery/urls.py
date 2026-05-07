from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.jewellery.views.admin import (
    AdminFeatureFlagsView,
    AdminLockPeriodView,
    AdminTrashRestoreView,
    AdminTrashView,
)
from apps.jewellery.views.billing import CalculateInvoiceView, CustomerViewSet, SalesInvoiceViewSet
from apps.jewellery.views.inventory import (
    ItemViewSet,
    StockMovementViewSet,
    StockTakeViewSet,
    TransferViewSet,
)
from apps.jewellery.views.master import (
    CategoryViewSet,
    DesignViewSet,
    MetalViewSet,
    NumberSeriesViewSet,
    PurityViewSet,
    TaxSlabViewSet,
)
from apps.jewellery.views.karigar import (
    CustomerOrderViewSet,
    KarigarIssueViewSet,
    KarigarReceiptViewSet,
    KarigarViewSet,
)
from apps.jewellery.views.outstanding import PartyOutstandingViewSet
from apps.jewellery.views.pledge import (
    GoldPledgeLoanViewSet,
    LoanRepaymentViewSet,
    LoanSchemeViewSet,
)
from apps.jewellery.views.rates import LiveRatesView, RateHistoryViewSet, RateOverrideView
from apps.jewellery.views.system import JewelleryBootstrapView

app_name = "jewellery"

router = DefaultRouter()

# Master data
router.register("metals", MetalViewSet, basename="metal")
router.register("purities", PurityViewSet, basename="purity")
router.register("categories", CategoryViewSet, basename="category")
router.register("designs", DesignViewSet, basename="design")
router.register("tax-slabs", TaxSlabViewSet, basename="tax-slab")
router.register("number-series", NumberSeriesViewSet, basename="number-series")

# Inventory (B-1.3)
router.register("items", ItemViewSet, basename="item")
router.register("stock-movements", StockMovementViewSet, basename="stock-movement")
router.register("stock-takes", StockTakeViewSet, basename="stock-take")
router.register("transfers", TransferViewSet, basename="transfer")

# Rates (B-1.4)
router.register("rates/history", RateHistoryViewSet, basename="rate-history")

# Billing (B-1.5)
router.register("sales/customers", CustomerViewSet, basename="customer")
router.register("sales/invoices", SalesInvoiceViewSet, basename="sales-invoice")

# Karigar & Orders (B-2.1)
router.register("karigar", KarigarViewSet, basename="karigar")
router.register("orders", CustomerOrderViewSet, basename="order")
router.register("karigar-issues", KarigarIssueViewSet, basename="karigar-issue")
router.register("karigar-receipts", KarigarReceiptViewSet, basename="karigar-receipt")

# Gold Pledge Loans (B-2.5)
router.register("loan-schemes", LoanSchemeViewSet, basename="loan-scheme")
router.register("pledge-loans", GoldPledgeLoanViewSet, basename="pledge-loan")
router.register("loan-repayments", LoanRepaymentViewSet, basename="loan-repayment")

# Party Outstanding (B-2.4)
router.register("outstanding", PartyOutstandingViewSet, basename="outstanding")

urlpatterns = [
    path("system/bootstrap/", JewelleryBootstrapView.as_view(), name="jwl-system-bootstrap"),
    path("admin/feature-flags/", AdminFeatureFlagsView.as_view(), name="admin-feature-flags"),
    path("admin/trash/", AdminTrashView.as_view(), name="admin-trash-list"),
    path(
        "admin/trash/<str:entity>/<uuid:object_id>/restore/",
        AdminTrashRestoreView.as_view(),
        name="admin-trash-restore",
    ),
    path("admin/lock-period/", AdminLockPeriodView.as_view(), name="admin-lock-period"),
    path("rates/live/", LiveRatesView.as_view(), name="rate-live"),
    path("rates/override/", RateOverrideView.as_view(), name="rate-override"),
    path("sales/calculate/", CalculateInvoiceView.as_view(), name="invoice-calculate"),
    path("", include(router.urls)),
]
