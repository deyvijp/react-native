from odoo import models, fields

class SalesRoute(models.Model):
    _name = 'sales.route'
    _description = 'Sales Route'

    name = fields.Char(string='Route Name', required=True)
    user_id = fields.Many2one('res.users', string='Salesperson', required=True)
    date = fields.Date(string='Date', default=fields.Date.context_today)
    state = fields.Selection([
        ('draft', 'Draft'),
        ('open', 'In Progress'),
        ('done', 'Done')
    ], string='Status', default='draft')
    
    line_ids = fields.One2many('sales.route.line', 'route_id', string='Visits')

class SalesRouteLine(models.Model):
    _name = 'sales.route.line'
    _description = 'Sales Route Line'

    route_id = fields.Many2one('sales.route', string='Route', required=True, ondelete='cascade')
    partner_id = fields.Many2one('res.partner', string='Customer', required=True)
    sequence = fields.Integer(string='Sequence', default=10)
    status = fields.Selection([
        ('pending', 'Pending'),
        ('visited', 'Visited'),
        ('skipped', 'Skipped')
    ], default='pending')
    visit_time = fields.Datetime(string='Visit Time')
