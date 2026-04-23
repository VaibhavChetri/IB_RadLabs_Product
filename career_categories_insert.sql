-- Career Categories Insert Statements
-- Run these INSERT statements to populate the career_categories table
-- After inserting, you can test the GET /api/career/categories endpoint

INSERT INTO career_categories (name, slug, description, display_order, is_active) VALUES
('Engineering', 'engineering', 'Engineering and technical development roles', 1, TRUE),
('Sales', 'sales', 'Sales and business development roles', 2, TRUE),
('Marketing', 'marketing', 'Marketing, communications, and brand management roles', 3, TRUE),
('Product', 'product', 'Product management and strategy roles', 4, TRUE),
('Design', 'design', 'UI/UX design and creative roles', 5, TRUE),
('Operations', 'operations', 'Operations, logistics, and supply chain roles', 6, TRUE),
('Customer Success', 'customer-success', 'Customer support and success roles', 7, TRUE),
('Finance', 'finance', 'Finance, accounting, and financial planning roles', 8, TRUE),
('Human Resources', 'human-resources', 'HR, talent acquisition, and people operations roles', 9, TRUE),
('Data & Analytics', 'data-analytics', 'Data science, analytics, and business intelligence roles', 10, TRUE),
('Quality Assurance', 'quality-assurance', 'QA, testing, and quality control roles', 11, TRUE),
('DevOps', 'devops', 'DevOps, infrastructure, and site reliability roles', 12, TRUE),
('Security', 'security', 'Cybersecurity and information security roles', 13, TRUE),
('Legal', 'legal', 'Legal, compliance, and regulatory roles', 14, TRUE),
('Executive', 'executive', 'Executive and leadership roles', 15, TRUE);

-- Verify the insert
-- SELECT * FROM career_categories ORDER BY display_order;
