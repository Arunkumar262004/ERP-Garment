<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Contact;
use App\Models\CrmTask;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\RawMaterial;
use App\Models\Size;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        foreach (['XS', 'S', 'M', 'L', 'XL', 'XXL'] as $index => $sizeName) {
            Size::create(['name' => $sizeName, 'sort_order' => $index]);
        }

        $brand = Brand::create(['name' => 'Kumar Basics']);
        Brand::create(['name' => 'Urban Threads']);

        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@erp.test',
            'password' => 'password',
            'role' => 'admin',
        ]);

        $sales = User::create([
            'name' => 'Sales User',
            'email' => 'sales@erp.test',
            'password' => 'password',
            'role' => 'sales',
        ]);

        User::create([
            'name' => 'Production User',
            'email' => 'production@erp.test',
            'password' => 'password',
            'role' => 'production',
        ]);

        // Contacts
        $b2b = Contact::create([
            'type' => 'b2b', 'name' => 'Rajesh Kumar', 'company_name' => 'Kumar Textiles Pvt Ltd',
            'email' => 'rajesh@kumartextiles.test', 'phone' => '9876543210', 'gst_number' => '27ABCDE1234F1Z5',
            'city' => 'Mumbai', 'state' => 'Maharashtra', 'country' => 'India', 'status' => 'active',
            'created_by' => $admin->id,
        ]);
        $b2b->update(['code' => sprintf('B2B-%05d', $b2b->id)]);

        $b2c = Contact::create([
            'type' => 'b2c', 'name' => 'Priya Sharma', 'email' => 'priya@example.test', 'phone' => '9123456780',
            'city' => 'Pune', 'state' => 'Maharashtra', 'country' => 'India', 'status' => 'active',
            'created_by' => $admin->id,
        ]);
        $b2c->update(['code' => sprintf('B2C-%05d', $b2c->id)]);

        $employee = Contact::create([
            'type' => 'employee', 'name' => 'Anita Verma', 'email' => 'anita@erp.test', 'phone' => '9988776655',
            'employee_code' => 'EMP-001', 'designation' => 'Production Supervisor', 'department' => 'Production',
            'date_of_joining' => now()->subYears(2), 'status' => 'active', 'created_by' => $admin->id,
        ]);
        $employee->update(['code' => sprintf('EMP-%05d', $employee->id)]);

        // CRM
        $lead = Lead::create([
            'contact_id' => $b2b->id, 'name' => 'Kumar Textiles Pvt Ltd', 'company_name' => 'Kumar Textiles Pvt Ltd',
            'email' => $b2b->email, 'phone' => $b2b->phone, 'source' => 'referral', 'status' => 'qualified',
            'expected_value' => 150000, 'expected_close_date' => now()->addDays(15),
            'assigned_to' => $sales->id, 'created_by' => $admin->id,
        ]);
        $lead->update(['lead_no' => sprintf('LEAD-%05d', $lead->id)]);

        CrmTask::create([
            'lead_id' => $lead->id, 'title' => 'Follow up on quotation', 'type' => 'follow_up',
            'priority' => 'high', 'status' => 'pending', 'assigned_to' => $sales->id,
            'due_date' => now()->addDays(3), 'created_by' => $admin->id,
        ]);

        // Accounts: Quotation -> Invoice -> Payment
        $quotation = Quotation::create([
            'contact_id' => $b2b->id, 'lead_id' => $lead->id, 'quotation_date' => now()->subDays(5),
            'valid_until' => now()->addDays(25), 'status' => 'accepted',
            'subtotal' => 100000, 'discount' => 0, 'tax' => 18000, 'total' => 118000,
            'created_by' => $sales->id,
        ]);
        $quotation->update(['quotation_no' => sprintf('QUO-%05d', $quotation->id)]);
        $quotation->items()->create([
            'description' => 'Cotton Fabric Shirts - Bulk Order', 'quantity' => 500, 'unit' => 'pcs',
            'unit_price' => 200, 'tax_percent' => 18, 'total' => 118000,
        ]);

        $invoice = Invoice::create([
            'contact_id' => $b2b->id, 'quotation_id' => $quotation->id, 'invoice_date' => now()->subDays(2),
            'due_date' => now()->addDays(28), 'status' => 'partial',
            'subtotal' => 100000, 'discount' => 0, 'tax' => 18000, 'total' => 118000,
            'paid_amount' => 50000, 'balance_amount' => 68000, 'created_by' => $sales->id,
        ]);
        $invoice->update(['invoice_no' => sprintf('INV-%05d', $invoice->id)]);
        $invoice->items()->create([
            'description' => 'Cotton Fabric Shirts - Bulk Order', 'quantity' => 500, 'unit' => 'pcs',
            'unit_price' => 200, 'tax_percent' => 18, 'total' => 118000,
        ]);
        Payment::create([
            'invoice_id' => $invoice->id, 'amount' => 50000, 'payment_date' => now()->subDay(),
            'payment_method' => 'bank_transfer', 'reference_no' => 'TXN123456', 'created_by' => $admin->id,
        ]);

        // Purchase
        $supplier = Supplier::create([
            'name' => 'Shree Fabrics Supply Co', 'contact_person' => 'Mahesh Patel', 'phone' => '9012345678',
            'email' => 'mahesh@shreefabrics.test', 'gst_number' => '24XYZAB5678C1Z2', 'status' => 'active',
        ]);
        $supplier->update(['code' => sprintf('SUP-%05d', $supplier->id)]);

        $rawMaterial = RawMaterial::create([
            'sku' => 'RM-COTTON-01', 'name' => 'Cotton Fabric Roll', 'category' => 'Fabric', 'unit' => 'meter',
            'current_stock' => 800, 'reorder_level' => 200, 'unit_price' => 120, 'default_supplier_id' => $supplier->id,
        ]);

        $po = PurchaseOrder::create([
            'supplier_id' => $supplier->id, 'order_date' => now()->subDays(10), 'expected_date' => now()->subDays(3),
            'status' => 'received', 'subtotal' => 60000, 'tax' => 0, 'total' => 60000, 'created_by' => $admin->id,
        ]);
        $po->update(['po_no' => sprintf('PO-%05d', $po->id)]);
        $po->items()->create([
            'raw_material_id' => $rawMaterial->id, 'quantity' => 500, 'unit_price' => 120, 'total' => 60000,
            'received_quantity' => 500,
        ]);

        // Production
        $productionOrder = ProductionOrder::create([
            'contact_id' => $b2b->id, 'quotation_id' => $quotation->id, 'invoice_id' => $invoice->id,
            'order_date' => now()->subDays(2), 'expected_delivery_date' => now()->addDays(10),
            'status' => 'in_production', 'total_quantity' => 500, 'brand_id' => $brand?->id, 'created_by' => $sales->id,
        ]);
        $productionOrder->update(['order_no' => sprintf('PRD-%05d', $productionOrder->id)]);
        $productionOrder->items()->create([
            'item_name' => 'Cotton Shirt', 'description' => 'Bulk order for Kumar Textiles',
            'quantity' => 500, 'unit' => 'pcs',
        ]);

        // Only the stages this demo order has actually reached — stitching/packing don't
        // exist yet, matching real orders where stages are added one at a time via Quick
        // Option rather than a fixed pipeline created upfront.
        $processes = ['dyeing', 'printing', 'cutting'];
        foreach ($processes as $i => $type) {
            $productionOrder->processes()->create([
                'process_type' => $type,
                'sequence' => $i + 1,
                'status' => $i < 2 ? 'completed' : 'in_progress',
                'quantity_completed' => $i < 2 ? 500 : 250,
                'start_date' => now()->subDays(5 - $i),
                'end_date' => $i < 2 ? now()->subDays(3 - $i) : null,
            ]);
        }

        $delivery = Delivery::create([
            'production_order_id' => $productionOrder->id, 'contact_id' => $b2b->id,
            'delivery_address' => $b2b->billing_address, 'status' => 'pending', 'created_by' => $admin->id,
        ]);
        $delivery->update(['delivery_no' => sprintf('DLV-%05d', $delivery->id)]);
    }
}
