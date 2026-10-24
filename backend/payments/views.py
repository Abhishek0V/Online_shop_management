from rest_framework.response import Response
from rest_framework.views import APIView

from common.permissions import IsCustomerRole

from . import services
from .serializers import FailedPaymentSerializer, VerifyPaymentSerializer


class VerifyPaymentView(APIView):
    permission_classes = [IsCustomerRole]

    def post(self, request):
        serializer = VerifyPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.verify_payment(request.user, **serializer.validated_data)
        return Response({"order_number": order.order_number, "status": order.status})


class PaymentFailedView(APIView):
    permission_classes = [IsCustomerRole]

    def post(self, request):
        serializer = FailedPaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = services.report_failed(request.user, serializer.validated_data["razorpay_order_id"])
        return Response({"order_number": order.order_number, "status": order.status})