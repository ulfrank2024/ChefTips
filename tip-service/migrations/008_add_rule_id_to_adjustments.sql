ALTER TABLE report_adjustments ADD COLUMN rule_id UUID REFERENCES tip_out_rules(id) ON DELETE SET NULL;
