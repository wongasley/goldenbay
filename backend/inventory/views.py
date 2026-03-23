from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from .models import Location, Product, StockLevel, InventoryDocument, DocumentLineItem
from .serializers import LocationSerializer, ProductSerializer, StockLevelSerializer, InventoryDocumentSerializer

class LocationListView(generics.ListAPIView):
    queryset = Location.objects.all().order_by('name')
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

class StockLevelListView(generics.ListAPIView):
    serializer_class = StockLevelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = StockLevel.objects.all().select_related('product', 'location')
        loc = self.request.query_params.get('location')
        if loc:
            qs = qs.filter(location_id=loc)
        return qs

class ProductLookupView(APIView):
    """ Used by the USB scanner on the frontend to identify a product """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barcode = request.query_params.get('barcode')
        if not barcode:
            return Response({"error": "Barcode required"}, status=400)

        # Check loose items first
        product = Product.objects.filter(barcode=barcode).first()
        is_box = False

        # If not found, check if it's a mother box
        if not product:
            product = Product.objects.filter(box_barcode=barcode).first()
            is_box = True

        if not product:
            return Response({"error": "Product not found"}, status=404)

        serializer = ProductSerializer(product)
        return Response({"product": serializer.data, "is_box": is_box})

class DocumentCreateView(APIView):
    """ Handles the submission of a new Requisition/Delivery/Transfer from the scanner form """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        items_data = data.pop('items', [])
        
        with transaction.atomic():
            # Create Document
            doc = InventoryDocument.objects.create(
                doc_type=data.get('doc_type'),
                status=data.get('status', 'PENDING'),
                source_location_id=data.get('source_location'),
                destination_location_id=data.get('destination_location'),
                notes=data.get('notes'),
                created_by=request.user
            )
            
            # Create Line Items
            for item in items_data:
                DocumentLineItem.objects.create(
                    document=doc,
                    product_id=item['product_id'],
                    quantity=item['quantity']
                )
                
        return Response({"message": "Document created successfully!", "id": doc.id}, status=201)

class DocumentApproveView(APIView):
    """ Only Inventory Managers can approve documents, triggering the stock movement """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if not (user.is_superuser or user.groups.filter(name='Inventory Manager').exists()):
            raise PermissionDenied("Only Inventory Managers can approve stock movements.")

        try:
            doc = InventoryDocument.objects.get(pk=pk)
            if doc.status == 'APPROVED':
                return Response({"error": "Document already approved."}, status=400)
                
            doc.status = 'APPROVED'
            doc.approved_by = user
            doc.save() # This triggers the post_save signal we wrote in models.py
            
            return Response({"message": f"{doc.doc_type} Approved and Stock Updated!"})
            
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class ProductCreateView(generics.CreateAPIView):
    """ Allows Inventory Managers to add new products to the catalog """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Inventory Manager', 'Admin']).exists()):
            raise PermissionDenied("Only Inventory Managers can add new products.")
        serializer.save()

class ProductUpdateView(generics.UpdateAPIView):
    """ Allows Inventory Managers to edit existing product details """
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Inventory Manager', 'Admin']).exists()):
            raise PermissionDenied("Only Inventory Managers can edit products.")
        serializer.save()