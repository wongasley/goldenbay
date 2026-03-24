from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Q
from .models import Location, Product, StockLevel, InventoryDocument, DocumentLineItem, Rack, UnitOfMeasure
from .serializers import LocationSerializer, ProductSerializer, StockLevelSerializer, InventoryDocumentSerializer, RackSerializer, UnitOfMeasureSerializer

# --- SETTINGS VIEWS ---
class LocationListCreateView(generics.ListCreateAPIView):
    queryset = Location.objects.all().order_by('name')
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

class LocationDetailView(generics.DestroyAPIView):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

class RackListCreateView(generics.ListCreateAPIView):
    queryset = Rack.objects.all().order_by('location__name', 'name')
    serializer_class = RackSerializer
    permission_classes = [IsAuthenticated]

class RackDetailView(generics.DestroyAPIView):
    queryset = Rack.objects.all()
    serializer_class = RackSerializer
    permission_classes = [IsAuthenticated]

class UOMListCreateView(generics.ListCreateAPIView):
    queryset = UnitOfMeasure.objects.all().order_by('name')
    serializer_class = UnitOfMeasureSerializer
    permission_classes = [IsAuthenticated]

class UOMDetailView(generics.DestroyAPIView):
    queryset = UnitOfMeasure.objects.all()
    serializer_class = UnitOfMeasureSerializer
    permission_classes = [IsAuthenticated]

# --- PRODUCT DATABASE VIEW ---
class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = Product.objects.all().order_by('name')
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(barcode__icontains=search) | Q(brand__icontains=search))
        return qs

class ProductLookupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        barcode = request.query_params.get('barcode')
        if not barcode:
            return Response({"error": "Barcode required"}, status=400)

        product = Product.objects.filter(barcode=barcode).first()
        is_box = False

        if not product:
            product = Product.objects.filter(box_barcode=barcode).first()
            is_box = True

        if not product:
            return Response({"error": "Product not found"}, status=404)

        serializer = ProductSerializer(product)
        return Response({"product": serializer.data, "is_box": is_box})

class ProductCreateView(generics.CreateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Inventory Manager', 'Admin']).exists()):
            raise PermissionDenied("Only Inventory Managers can add new products.")
        serializer.save()

class ProductUpdateView(generics.UpdateAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def perform_update(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Inventory Manager', 'Admin']).exists()):
            raise PermissionDenied("Only Inventory Managers can edit products.")
        serializer.save()


# --- STOCK AND DOCUMENTS VIEWS ---
class StockLevelListView(generics.ListAPIView):
    serializer_class = StockLevelSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # FIX: Ensure it strictly filters out any old existing 0 quantity items
        qs = StockLevel.objects.filter(quantity__gt=0).select_related('product', 'location')
        loc = self.request.query_params.get('location')
        if loc:
            qs = qs.filter(location_id=loc)
        return qs

class DocumentListView(generics.ListAPIView):
    serializer_class = InventoryDocumentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return InventoryDocument.objects.all().order_by('-created_at')

class DocumentCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        data = request.data
        items_data = data.pop('items', [])
        
        with transaction.atomic():
            doc = InventoryDocument.objects.create(
                doc_type=data.get('doc_type'),
                status=data.get('status', 'PENDING'),
                source_location_id=data.get('source_location'),
                destination_location_id=data.get('destination_location'),
                notes=data.get('notes'),
                created_by=request.user
            )
            
            for item in items_data:
                DocumentLineItem.objects.create(
                    document=doc,
                    product_id=item['product_id'],
                    quantity=item['quantity']
                )
                
        return Response({"message": "Document created successfully!", "id": doc.id}, status=201)

class DocumentApproveView(APIView):
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
            doc.save() 
            
            return Response({"message": f"{doc.doc_type} Approved and Stock Updated!"})
            
        except Exception as e:
            return Response({"error": str(e)}, status=400)