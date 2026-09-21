<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Contact;
use App\Models\CrmTask;
use App\Models\Delivery;
use App\Models\Invoice;
use App\Models\Lead;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductionOrder;
use App\Models\PurchaseOrder;
use App\Models\Quotation;
use App\Models\RawMaterial;
use App\Models\Role;
use App\Models\Size;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Standalone demo-data seeder — adds ~10 records to every section of the
 * app on top of whatever's already there. Deliberately NOT wired into
 * DatabaseSeeder (which drives the automatic first-boot seed): run it
 * explicitly with `php artisan db:seed --class=DemoDataSeeder` so it never
 * fires unexpectedly against a database someone is already using.
 *
 * Names, cities and company names are Tamil Nadu–flavored (Chennai,
 * Coimbatore/Kovai, Tiruppur, Madurai, Salem, Erode, Karur — all real
 * garment/textile hubs) so the demo reads like a genuine TN garment
 * business rather than generic placeholder data.
 *
 * REAL_TEST_EMAIL is deliberately wired into the very first B2B contact
 * (and therefore the first quotation/invoice/production order, since every
 * loop below indexes contacts by the same position) so that approving that
 * quotation, completing that order, etc. during manual testing sends real
 * mail to an inbox you actually own instead of a throwaway *.test address.
 */
class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    protected const REAL_TEST_EMAIL = 'arunkumar957877@gmail.com';

    protected const GARMENTS = [
        'Cotton T-Shirt', 'Denim Jeans', 'Formal Shirt', 'Polo Shirt', 'Hoodie',
        'Cargo Pants', 'Linen Kurta', 'School Uniform Set', 'Sports Jersey', 'Winter Jacket',
    ];

    protected const FABRICS = [
        'Cotton Fabric Roll', 'Denim Cloth', 'Linen Fabric', 'Polyester Blend', 'Twill Cotton',
        'Rib Knit Fabric', 'Fleece Fabric', 'Canvas Cloth', 'Jersey Knit', 'Corduroy Fabric',
    ];

    protected const TN_CITIES = [
        'Chennai', 'Coimbatore', 'Tiruppur', 'Madurai', 'Salem', 'Erode', 'Karur',
        'Tirunelveli', 'Vellore', 'Thanjavur', 'Dindigul', 'Namakkal', 'Sivakasi', 'Nagercoil', 'Trichy',
    ];

    protected const TN_MALE_NAMES = [
        'Karthik Subramaniam', 'Suresh Natarajan', 'Murugan Pillai', 'Elumalai Raja', 'Saravanan Krishnan',
        'Prabhu Chandrasekaran', 'Rajesh Ganesan', 'Senthil Kumaresan', 'Balaji Venkataraman', 'Vignesh Shanmugam',
        'Dinesh Ramanathan', 'Arun Swaminathan', 'Manikandan Murthy', 'Gopinath Sundaram', 'Ramkumar Balasubramaniam',
        'Sathish Chettiar', 'Velmurugan Gounder', 'Kannan Mudaliar', 'Pandiyan Nadar', 'Thangaraj Iyer',
    ];

    protected const TN_FEMALE_NAMES = [
        'Meenakshi Sundaram', 'Lakshmi Narayanan', 'Kavya Rajendran', 'Divya Shankar', 'Priya Venkatesan',
        'Deepa Chandrasekaran', 'Saranya Muthukumar', 'Nithya Ramaswamy', 'Revathi Govindarajan', 'Sangeetha Elango',
        'Vani Krishnamurthy', 'Abirami Sivakumar', 'Bhuvana Ranganathan', 'Gayathri Palaniappan', 'Janani Arumugam',
        'Kalpana Subbiah', 'Malar Kaliappan', 'Nandhini Thiagarajan', 'Parvathi Duraisamy', 'Uma Maheswari',
    ];

    protected static function tnName(int $seed): string
    {
        $pool = $seed % 2 === 0 ? self::TN_MALE_NAMES : self::TN_FEMALE_NAMES;

        return $pool[intdiv($seed, 2) % count($pool)];
    }

    protected static function tnCity(int $seed): string
    {
        return self::TN_CITIES[$seed % count(self::TN_CITIES)];
    }

    public function run(): void
    {
        $brands = $this->seedBrands();
        $sizes = Size::pluck('id')->all();
        $users = $this->seedUsers();
        $roles = $this->seedRoles();
        $this->assignRolesToUsers($users, $roles);

        $b2bContacts = $this->seedContacts('b2b', 10);
        $b2cContacts = $this->seedContacts('b2c', 10);
        $employees = $this->seedEmployees(10);

        $leads = $this->seedLeads($b2bContacts, $users);
        $this->seedCrmTasks($leads, $b2bContacts, $users);

        $quotations = $this->seedQuotations($b2bContacts, $leads, $users);
        $invoices = $this->seedInvoices($b2bContacts, $quotations, $users);
        $this->seedPayments($invoices, $users);

        $this->seedProducts($brands, $sizes);

        $suppliers = $this->seedSuppliers();
        $rawMaterials = $this->seedRawMaterials($suppliers);
        $this->seedPurchaseOrders($suppliers, $rawMaterials, $users);

        $productionOrders = $this->seedProductionOrders($b2bContacts, $quotations, $invoices, $brands, $users, $sizes, $employees);
        $this->seedDeliveries($productionOrders, $b2bContacts, $users);
    }

    protected function seedBrands(): array
    {
        $names = ['Kumar Basics', 'Urban Threads', 'Style Weave', 'Cotton Craft', 'Trendy Fits',
            'Classic Wear', 'Modern Drape', 'Comfort Line', 'Elite Apparel', 'Sunrise Textiles'];

        return collect($names)->map(fn ($name) => Brand::firstOrCreate(['name' => $name])->id)->all();
    }

    protected function seedUsers(): array
    {
        $defs = [
            ['name' => 'Vignesh Shanmugam', 'role' => 'sales', 'specialization' => 'healthcare_erp'],
            ['name' => 'Nithya Ramaswamy', 'role' => 'sales', 'specialization' => 'basic_crm'],
            ['name' => 'Arun Swaminathan', 'role' => 'sales', 'specialization' => 'automation_crm'],
            ['name' => 'Kavya Rajendran', 'role' => 'accounts', 'specialization' => null],
            ['name' => 'Ramkumar Balasubramaniam', 'role' => 'purchase', 'specialization' => null],
            ['name' => 'Sangeetha Elango', 'role' => 'crm', 'specialization' => 'general'],
            ['name' => 'Dinesh Ramanathan', 'role' => 'viewer', 'specialization' => null],
        ];

        $ids = User::pluck('id')->all();

        foreach ($defs as $def) {
            $email = strtolower(str_replace(' ', '.', $def['name'])).'@erp.test';
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => $def['name'],
                    'password' => Hash::make('password'),
                    'role' => $def['role'],
                    'specialization' => $def['specialization'],
                    'is_active' => true,
                ]
            );
            $ids[] = $user->id;
        }

        return array_values(array_unique($ids));
    }

    protected function seedRoles(): array
    {
        $extra = [
            ['name' => 'Healthcare ERP Specialist', 'permissions' => ['dashboard', 'crm.leads', 'crm.tasks', 'accounts.quotations', 'reports']],
            ['name' => 'Automation Specialist', 'permissions' => ['dashboard', 'crm.leads', 'production', 'reports']],
            ['name' => 'Support Staff', 'permissions' => ['dashboard', 'crm.tasks', 'delivery']],
        ];

        foreach ($extra as $def) {
            Role::firstOrCreate(['name' => $def['name']], ['permissions' => $def['permissions']]);
        }

        return Role::pluck('id')->all();
    }

    protected function assignRolesToUsers(array $userIds, array $roleIds): void
    {
        $users = User::whereIn('id', $userIds)->whereNull('role_id')->get();

        foreach ($users as $i => $user) {
            $user->update(['role_id' => $roleIds[$i % count($roleIds)]]);
        }
    }

    protected function seedContacts(string $type, int $count): array
    {
        $prefix = $type === 'b2b' ? 'B2B' : 'B2C';
        $companies = [
            'Tiruppur Knitwear Exports', 'Kovai Cotton Mills', 'Erode Textile Traders', 'Karur Home Textiles',
            'Salem Silk & Handloom', 'Madurai Meenakshi Garments', 'Sivakasi Apparel Hub', 'Chennai Fashion House',
            'Nagercoil Garments Co', 'Trichy Textile Exports',
        ];
        $ids = [];

        for ($i = 0; $i < $count; $i++) {
            $name = self::tnName($type === 'b2b' ? $i : $i + 30);
            $isRealTestContact = $type === 'b2b' && $i === 0;
            $contact = Contact::create([
                'type' => $type,
                'name' => $name,
                'company_name' => $type === 'b2b' ? $companies[$i % count($companies)] : null,
                'email' => $isRealTestContact
                    ? self::REAL_TEST_EMAIL
                    : strtolower(str_replace(' ', '.', $name)).".$type{$i}@example.test",
                'phone' => (string) fake()->numerify('9#########'),
                'gst_number' => $type === 'b2b' ? '33'.strtoupper(fake()->bothify('???##????#?#')) : null,
                'city' => self::tnCity($i),
                'state' => 'Tamil Nadu',
                'country' => 'India',
                'status' => 'active',
            ]);
            $contact->update(['code' => sprintf('%s-%05d', $prefix, $contact->id)]);
            $ids[] = $contact->id;
        }

        return $ids;
    }

    protected function seedEmployees(int $count): array
    {
        $categories = ['cutting', 'dyeing', 'stitching', 'printing', 'packing', 'quality_check', 'other'];
        $designations = ['Cutting Master', 'Dyeing Supervisor', 'Stitching Lead', 'Printing Operator',
            'Packing Supervisor', 'QC Inspector', 'Floor Manager', 'Line Supervisor', 'Machine Operator', 'Helper'];
        $ids = [];

        for ($i = 0; $i < $count; $i++) {
            $name = self::tnName($i + 60);
            $employee = Contact::create([
                'type' => 'employee',
                'name' => $name,
                'email' => strtolower(str_replace(' ', '.', $name)).".emp{$i}@erp.test",
                'phone' => (string) fake()->numerify('9#########'),
                'employee_code' => sprintf('EMP-%03d', $i + 100),
                'designation' => $designations[$i % count($designations)],
                'department' => 'Production',
                'category' => $categories[$i % count($categories)],
                'date_of_joining' => now()->subDays(fake()->numberBetween(30, 1000)),
                'status' => 'active',
            ]);
            $employee->update(['code' => sprintf('EMP-%05d', $employee->id)]);
            $ids[] = $employee->id;
        }

        return $ids;
    }

    protected function seedLeads(array $contactIds, array $userIds): array
    {
        $sources = ['website', 'referral', 'cold_call', 'social_media', 'exhibition', 'other'];
        $statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
        $ids = [];

        $leadCompanies = ['Kovai Weavers Guild', 'Tiruppur Yarn House', 'Madurai Silk Emporium', 'Salem Cotton Traders',
            'Erode Textile Junction', 'Karur Home Furnishings', 'Sivakasi Uniform Suppliers', 'Nagercoil Fabric Mart',
            'Trichy Garment Traders', 'Chennai Retail Collective'];

        for ($i = 0; $i < 10; $i++) {
            $garment = self::GARMENTS[$i % count(self::GARMENTS)];
            $name = self::tnName($i + 80);
            $lead = Lead::create([
                'contact_id' => $i % 3 === 0 ? $contactIds[$i % count($contactIds)] : null,
                'name' => $name,
                'company_name' => fake()->boolean(60) ? $leadCompanies[$i % count($leadCompanies)] : null,
                'email' => strtolower(str_replace(' ', '.', $name)).".lead{$i}@example.test",
                'phone' => (string) fake()->numerify('9#########'),
                'source' => $sources[$i % count($sources)],
                'status' => $statuses[$i % count($statuses)],
                'expected_value' => fake()->numberBetween(20000, 500000),
                'expected_close_date' => now()->addDays(fake()->numberBetween(5, 60)),
                'follow_up_date' => now()->addDays(fake()->numberBetween(-5, 14)),
                'assigned_to' => $userIds[array_rand($userIds)],
                'notes' => "Enquiry for {$garment}.",
            ]);
            $lead->update(['lead_no' => sprintf('LEAD-%05d', $lead->id)]);
            $ids[] = $lead->id;
        }

        return $ids;
    }

    protected function seedCrmTasks(array $leadIds, array $contactIds, array $userIds): void
    {
        $types = ['call', 'meeting', 'email', 'follow_up', 'other'];
        $priorities = ['low', 'medium', 'high'];
        $statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
        $titles = ['Follow up on quotation', 'Schedule product demo', 'Send catalogue', 'Discuss pricing',
            'Confirm order quantity', 'Site visit', 'Sample dispatch follow-up', 'Renewal discussion',
            'Payment reminder call', 'Onboarding call'];

        for ($i = 0; $i < 10; $i++) {
            CrmTask::create([
                'lead_id' => $leadIds[$i % count($leadIds)],
                'contact_id' => fake()->boolean(40) ? $contactIds[$i % count($contactIds)] : null,
                'title' => $titles[$i],
                'description' => "Task auto-generated for demo data.",
                'type' => $types[$i % count($types)],
                'priority' => $priorities[$i % count($priorities)],
                'status' => $statuses[$i % count($statuses)],
                'assigned_to' => $userIds[array_rand($userIds)],
                'due_date' => now()->addDays(fake()->numberBetween(-3, 14)),
            ]);
        }
    }

    protected function computeTotals(array $items): array
    {
        $subtotal = 0;
        $discount = 0;
        $tax = 0;

        foreach ($items as $item) {
            $lineDiscount = $item['discount'] ?? 0;
            $lineBase = $item['quantity'] * $item['unit_price'] - $lineDiscount;
            $subtotal += $item['quantity'] * $item['unit_price'];
            $discount += $lineDiscount;
            $tax += $lineBase * (($item['tax_percent'] ?? 0) / 100);
        }

        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'tax' => round($tax, 2),
            'total' => round($subtotal - $discount + $tax, 2),
        ];
    }

    protected function lineTotal(array $item): float
    {
        $base = $item['quantity'] * $item['unit_price'] - ($item['discount'] ?? 0);

        return round($base + $base * (($item['tax_percent'] ?? 0) / 100), 2);
    }

    protected function seedQuotations(array $contactIds, array $leadIds, array $userIds): array
    {
        $statuses = ['draft', 'sent', 'approved', 'rejected', 'expired'];
        $ids = [];

        for ($i = 0; $i < 10; $i++) {
            $garment = self::GARMENTS[$i % count(self::GARMENTS)];
            $items = [[
                'description' => "{$garment} - Bulk Order",
                'quantity' => fake()->numberBetween(100, 1000),
                'unit' => 'pcs',
                'unit_price' => fake()->numberBetween(150, 800),
                'discount' => fake()->boolean(30) ? fake()->numberBetween(500, 5000) : 0,
                'tax_percent' => 18,
            ]];
            $totals = $this->computeTotals($items);

            $quotation = Quotation::create([
                'contact_id' => $contactIds[$i % count($contactIds)],
                'lead_id' => fake()->boolean(50) ? $leadIds[$i % count($leadIds)] : null,
                'quotation_date' => now()->subDays(fake()->numberBetween(1, 30)),
                'valid_until' => now()->addDays(fake()->numberBetween(10, 45)),
                'status' => $statuses[$i % count($statuses)],
                'notes' => "Quotation for {$garment}.",
                'created_by' => $userIds[array_rand($userIds)],
                ...$totals,
            ]);
            $quotation->update(['quotation_no' => sprintf('QUO-%05d', $quotation->id)]);
            foreach ($items as $item) {
                $quotation->items()->create([...$item, 'total' => $this->lineTotal($item)]);
            }
            $ids[] = $quotation->id;
        }

        return $ids;
    }

    protected function seedInvoices(array $contactIds, array $quotationIds, array $userIds): array
    {
        $statuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];
        $ids = [];

        for ($i = 0; $i < 10; $i++) {
            $garment = self::GARMENTS[$i % count(self::GARMENTS)];
            $items = [[
                'description' => "{$garment} - Bulk Order",
                'quantity' => fake()->numberBetween(100, 1000),
                'unit' => 'pcs',
                'unit_price' => fake()->numberBetween(150, 800),
                'discount' => 0,
                'tax_percent' => 18,
            ]];
            $totals = $this->computeTotals($items);
            $status = $statuses[$i % count($statuses)];
            $paid = match (true) {
                $status === 'paid' => $totals['total'],
                $status === 'partial' => round($totals['total'] * 0.4, 2),
                default => 0,
            };

            $invoice = Invoice::create([
                'contact_id' => $contactIds[$i % count($contactIds)],
                'quotation_id' => fake()->boolean(50) ? $quotationIds[$i % count($quotationIds)] : null,
                'invoice_date' => now()->subDays(fake()->numberBetween(1, 25)),
                'due_date' => now()->addDays(fake()->numberBetween(5, 30)),
                'status' => $status,
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'tax' => $totals['tax'],
                'total' => $totals['total'],
                'paid_amount' => $paid,
                'balance_amount' => round($totals['total'] - $paid, 2),
                'notes' => "Invoice for {$garment}.",
                'created_by' => $userIds[array_rand($userIds)],
            ]);
            $invoice->update(['invoice_no' => sprintf('INV-%05d', $invoice->id)]);
            foreach ($items as $item) {
                $invoice->items()->create([...$item, 'total' => $this->lineTotal($item)]);
            }
            $ids[] = $invoice->id;
        }

        return $ids;
    }

    protected function seedPayments(array $invoiceIds, array $userIds): void
    {
        $methods = ['cash', 'bank_transfer', 'upi', 'cheque', 'card', 'other'];
        $invoices = Invoice::whereIn('id', $invoiceIds)->where('paid_amount', '>', 0)->get();

        $i = 0;
        foreach ($invoices as $invoice) {
            Payment::create([
                'invoice_id' => $invoice->id,
                'amount' => $invoice->paid_amount,
                'payment_date' => now()->subDays(fake()->numberBetween(0, 10)),
                'payment_method' => $methods[$i % count($methods)],
                'reference_no' => 'TXN'.fake()->unique()->numerify('######'),
                'created_by' => $userIds[array_rand($userIds)],
            ]);
            $i++;
            if ($i >= 10) {
                break;
            }
        }

        // Pad up to 10 payments even if fewer invoices had a paid_amount.
        $remaining = Invoice::whereIn('id', $invoiceIds)->get();
        while ($i < 10 && $remaining->isNotEmpty()) {
            $invoice = $remaining[$i % $remaining->count()];
            $amount = min(1000 * ($i + 1), max((float) $invoice->balance_amount, 500));
            Payment::create([
                'invoice_id' => $invoice->id,
                'amount' => $amount,
                'payment_date' => now()->subDays(fake()->numberBetween(0, 10)),
                'payment_method' => $methods[$i % count($methods)],
                'reference_no' => 'TXN'.fake()->unique()->numerify('######'),
                'created_by' => $userIds[array_rand($userIds)],
            ]);
            $i++;
        }
    }

    protected function seedProducts(array $brandIds, array $sizeIds): void
    {
        $colors = ['White', 'Black', 'Navy', 'Grey', 'Maroon', 'Olive', 'Beige', 'Sky Blue', 'Red', 'Brown'];

        for ($i = 0; $i < 10; $i++) {
            $garment = self::GARMENTS[$i % count(self::GARMENTS)];
            $product = Product::create([
                'name' => $garment.' — '.($i + 1),
                'brand_id' => $brandIds[$i % count($brandIds)],
                'garment_type' => $garment,
                'category' => fake()->randomElement(['Topwear', 'Bottomwear', 'Uniform', 'Outerwear']),
                'hsn_code' => (string) fake()->numerify('6###'),
                'description' => "Demo product — {$garment}.",
                'status' => 'active',
            ]);

            foreach (array_slice($sizeIds, 0, 3) as $sizeId) {
                $product->variants()->create([
                    'size_id' => $sizeId,
                    'color' => $colors[$i % count($colors)],
                    'sku' => strtoupper(fake()->bothify('SKU-####-??')),
                    'stock_quantity' => fake()->numberBetween(0, 200),
                    'price' => fake()->numberBetween(300, 1500),
                    'cost_price' => fake()->numberBetween(150, 900),
                ]);
            }
        }
    }

    protected function seedSuppliers(): array
    {
        $names = ['Sri Meenakshi Fabrics', 'Kovai Yarn Traders', 'Tiruppur Dyeing Works', 'Annamalai Textile Mills',
            'Murugan Threads & Trims', 'Salem Textile Agency', 'Karur Bedsheet Suppliers', 'Lakshmi Packaging Supplies',
            'SVS Textiles', 'Nadar Cotton Traders'];
        $ids = [];

        foreach ($names as $i => $name) {
            $supplier = Supplier::create([
                'name' => $name,
                'contact_person' => self::tnName($i + 100),
                'phone' => (string) fake()->numerify('9#########'),
                'email' => strtolower(str_replace(' ', '.', $name)).'@supplier.test',
                'gst_number' => '33'.strtoupper(fake()->bothify('???##????#?#')),
                'status' => 'active',
            ]);
            $supplier->update(['code' => sprintf('SUP-%05d', $supplier->id)]);
            $ids[] = $supplier->id;
        }

        return $ids;
    }

    protected function seedRawMaterials(array $supplierIds): array
    {
        $ids = [];

        foreach (self::FABRICS as $i => $fabric) {
            $material = RawMaterial::firstOrCreate(
                ['sku' => sprintf('RM-DEMO-%03d', $i + 1)],
                [
                    'name' => $fabric,
                    'category' => 'Fabric',
                    'unit' => 'meter',
                    'current_stock' => fake()->numberBetween(50, 1000),
                    'reorder_level' => 200,
                    'unit_price' => fake()->numberBetween(80, 250),
                    'default_supplier_id' => $supplierIds[$i % count($supplierIds)],
                ]
            );
            $ids[] = $material->id;
        }

        return $ids;
    }

    protected function seedPurchaseOrders(array $supplierIds, array $rawMaterialIds, array $userIds): void
    {
        $statuses = ['draft', 'ordered', 'partially_received', 'received', 'cancelled'];

        for ($i = 0; $i < 10; $i++) {
            $quantity = fake()->numberBetween(100, 500);
            $unitPrice = fake()->numberBetween(80, 250);
            $total = round($quantity * $unitPrice, 2);
            $status = $statuses[$i % count($statuses)];

            $po = PurchaseOrder::create([
                'supplier_id' => $supplierIds[$i % count($supplierIds)],
                'order_date' => now()->subDays(fake()->numberBetween(1, 30)),
                'expected_date' => now()->addDays(fake()->numberBetween(-5, 20)),
                'status' => $status,
                'subtotal' => $total,
                'tax' => 0,
                'total' => $total,
                'created_by' => $userIds[array_rand($userIds)],
            ]);
            $po->update(['po_no' => sprintf('PO-%05d', $po->id)]);
            $po->items()->create([
                'raw_material_id' => $rawMaterialIds[$i % count($rawMaterialIds)],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total' => $total,
                'received_quantity' => $status === 'received' ? $quantity : ($status === 'partially_received' ? intdiv($quantity, 2) : 0),
            ]);
        }
    }

    protected function seedProductionOrders(
        array $contactIds,
        array $quotationIds,
        array $invoiceIds,
        array $brandIds,
        array $userIds,
        array $sizeIds,
        array $employeeIds
    ): array {
        $statuses = ['pending', 'in_production', 'completed', 'delivered', 'cancelled'];
        $processTypes = ['cutting', 'dyeing', 'stitching', 'printing', 'packing', 'quality_check'];
        $ids = [];

        for ($i = 0; $i < 10; $i++) {
            $garment = self::GARMENTS[$i % count(self::GARMENTS)];
            $quantity = fake()->numberBetween(100, 1000);
            $status = $statuses[$i % count($statuses)];

            $order = ProductionOrder::create([
                'contact_id' => $contactIds[$i % count($contactIds)],
                'quotation_id' => fake()->boolean(40) ? $quotationIds[$i % count($quotationIds)] : null,
                'invoice_id' => fake()->boolean(40) ? $invoiceIds[$i % count($invoiceIds)] : null,
                'order_date' => now()->subDays(fake()->numberBetween(1, 20)),
                'expected_delivery_date' => now()->addDays(fake()->numberBetween(5, 30)),
                'status' => $status,
                'total_quantity' => $quantity,
                'brand_id' => $brandIds[$i % count($brandIds)],
                'order_type' => fake()->boolean(80) ? 'own' : 'others',
                'notes' => "Demo production order for {$garment}.",
                'created_by' => $userIds[array_rand($userIds)],
            ]);
            $order->update(['order_no' => sprintf('PRD-%05d', $order->id)]);
            $order->items()->create([
                'item_name' => $garment,
                'description' => "Demo order — {$garment}.",
                'quantity' => $quantity,
                'unit' => 'pcs',
                'size_id' => $sizeIds[$i % count($sizeIds)],
                'color' => fake()->safeColorName(),
            ]);

            $stageCount = fake()->numberBetween(1, 3);
            for ($s = 0; $s < $stageCount; $s++) {
                $order->processes()->create([
                    'process_type' => $processTypes[$s % count($processTypes)],
                    'sequence' => $s + 1,
                    'status' => $s < $stageCount - 1 ? 'completed' : ($status === 'pending' ? 'pending' : 'in_progress'),
                    'assigned_employee_id' => $employeeIds[array_rand($employeeIds)],
                    'assigned_to' => $userIds[array_rand($userIds)],
                    'quantity_completed' => $s < $stageCount - 1 ? $quantity : intdiv($quantity, 2),
                    'start_date' => now()->subDays($stageCount - $s),
                    'end_date' => $s < $stageCount - 1 ? now()->subDays($stageCount - $s - 1) : null,
                    'due_date' => now()->addDays(fake()->numberBetween(1, 10)),
                ]);
            }

            $ids[] = $order->id;
        }

        return $ids;
    }

    protected function seedDeliveries(array $productionOrderIds, array $contactIds, array $userIds): void
    {
        $statuses = ['pending', 'dispatched', 'delivered', 'returned'];
        $orders = ProductionOrder::whereIn('id', $productionOrderIds)->get();

        foreach ($orders as $i => $order) {
            $delivery = Delivery::create([
                'production_order_id' => $order->id,
                'contact_id' => $order->contact_id,
                'delivery_date' => now()->addDays(fake()->numberBetween(-5, 15)),
                'delivery_address' => fake()->buildingNumber().', '.self::tnCity($i).', Tamil Nadu, India',
                'status' => $statuses[$i % count($statuses)],
                'tracking_no' => strtoupper(fake()->bothify('TRK-########')),
                'delivered_by' => $userIds ? self::tnName($i + 120) : null,
                'created_by' => $userIds[array_rand($userIds)],
            ]);
            $delivery->update(['delivery_no' => sprintf('DLV-%05d', $delivery->id)]);
        }
    }
}
