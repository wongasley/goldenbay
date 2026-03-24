import csv
import io
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from rest_framework.parsers import MultiPartParser, FormParser
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
            qs = qs.filter(Q(name__icontains=search) | Q(barcode__icontains=search) | Q(brand__icontains=search) | Q(category__icontains=search)) # <-- Added category to search
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
                source_rack_id=data.get('source_rack'),           # <-- FIX: Now capturing source rack
                destination_location_id=data.get('destination_location'),
                destination_rack_id=data.get('destination_rack'), # <-- FIX: Now capturing destination rack
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
        
class BulkUploadProductsView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        if not (user.is_superuser or user.groups.filter(name__in=['Inventory Manager', 'Admin']).exists()):
            raise PermissionDenied("Only Inventory Managers can bulk upload products.")

        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided."}, status=400)

        if not file.name.endswith('.csv'):
            return Response({"error": "Please upload a valid CSV file."}, status=400)

        try:
            # Decode the file
            decoded_file = file.read().decode('utf-8-sig') # utf-8-sig removes Excel's hidden BOM characters
            io_string = io.StringIO(decoded_file)
            reader = csv.DictReader(io_string)
            
            products_created = 0
            products_updated = 0
            stock_updated = 0

            with transaction.atomic():
                for row in reader:
                    # Clean up header keys to be case-insensitive and strip spaces
                    clean_row = {k.strip().lower(): v.strip() for k, v in row.items() if k}
                    
                    name = clean_row.get('name')
                    barcode = clean_row.get('barcode')
                    
                    # Skip empty rows or rows missing critical identifiers
                    if not name or not barcode:
                        continue 
                        
                    brand = clean_row.get('brand', '')
                    category = clean_row.get('category', 'Uncategorized')
                    base_unit = clean_row.get('base_unit', 'Piece')
                    box_barcode = clean_row.get('box_barcode', '')
                    
                    try:
                        units_per_box = int(clean_row.get('units_per_box', 1))
                    except ValueError:
                        units_per_box = 1
                        
                    try:
                        cost_price = float(clean_row.get('cost_price', 0.0))
                    except ValueError:
                        cost_price = 0.0

                    # 1. Ensure the Unit of Measure exists
                    UnitOfMeasure.objects.get_or_create(name=base_unit)

                    # 2. Update or Create the Product based on Barcode
                    product, created = Product.objects.update_or_create(
                        barcode=barcode,
                        defaults={
                            'name': name,
                            'brand': brand,
                            'category': category,
                            'box_barcode': box_barcode,
                            'base_unit': base_unit,
                            'units_per_box': units_per_box,
                            'cost_price': cost_price
                        }
                    )
                    
                    if created:
                        products_created += 1
                    else:
                        products_updated += 1
                        
                    # 3. Handle Location, Rack, and Stock Assignment (If provided in the CSV)
                    loc_name = clean_row.get('location')
                    rack_name = clean_row.get('rack')
                    qty_str = clean_row.get('quantity')
                    
                    if loc_name and rack_name and qty_str:
                        try:
                            qty = int(qty_str)
                            # Auto-create the Room and the Rack if they don't exist yet!
                            loc, _ = Location.objects.get_or_create(name=loc_name)
                            rack, _ = Rack.objects.get_or_create(location=loc, name=rack_name)
                            
                            # Set the stock level
                            stock, _ = StockLevel.objects.get_or_create(
                                product=product,
                                location=loc,
                                rack=rack
                            )
                            stock.quantity = qty  # Overwrites to establish initial baseline
                            stock.save()
                            stock_updated += 1
                        except ValueError:
                            pass # Skip if quantity isn't a valid number
                            
            return Response({
                "message": f"Success! {products_created} created, {products_updated} updated. {stock_updated} stock locations set."
            }, status=200)

        except Exception as e:
            return Response({"error": f"Failed to process CSV: {str(e)}"}, status=400)