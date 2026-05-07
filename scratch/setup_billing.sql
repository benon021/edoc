CREATE TABLE IF NOT EXISTS public.invoices (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES public.patient(pid),
    receipt_no VARCHAR(50) UNIQUE NOT NULL,
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    discount_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Pending', -- Pending, Partially Paid, Paid, Cancelled
    payment_method VARCHAR(50), -- Cash, Card, Insurance, M-Pesa, Split
    insurance_provider VARCHAR(100),
    insurance_number VARCHAR(100),
    cashier_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES public.invoices(id) ON DELETE CASCADE,
    item_type VARCHAR(50) NOT NULL, -- Consultation, Registration, Laboratory, Pharmacy, Procedure
    item_id INTEGER, 
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Billed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set permissions (optional depending on RLS)
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.invoice_items;