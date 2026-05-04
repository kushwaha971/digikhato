from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.jewellery.views.master import (
    CategoryViewSet,
    DesignViewSet,
    MetalViewSet,
    NumberSeriesViewSet,
    PurityViewSet,
    TaxSlabViewSet,
)
from apps.jewellery.views.system import JewelleryBootstrapView

app_name = "jewellery"

router = DefaultRouter()
router.register("metals", MetalViewSet, basename="metal")
router.register("purities", PurityViewSet, basename="purity")
router.register("categories", CategoryViewSet, basename="category")
router.register("designs", DesignViewSet, basename="design")
router.register("tax-slabs", TaxSlabViewSet, basename="tax-slab")
router.register("number-series", NumberSeriesViewSet, basename="number-series")

urlpatterns = [
    path("system/bootstrap/", JewelleryBootstrapView.as_view(), name="jwl-system-bootstrap"),
    path("", include(router.urls)),
]
