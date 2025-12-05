from odoo import models, fields

class SalesTracking(models.Model):
    _name = 'sales.tracking'
    _description = 'Sales Tracking Log'
    _order = 'timestamp desc'

    user_id = fields.Many2one('res.users', string='Salesperson', required=True)
    latitude = fields.Float(string='Latitude', digits=(10, 7))
    longitude = fields.Float(string='Longitude', digits=(10, 7))
    timestamp = fields.Datetime(string='Timestamp', required=True)
    battery_level = fields.Float(string='Battery Level')
    speed = fields.Float(string='Speed (m/s)')
    heading = fields.Float(string='Heading')
    
    # Optional: Link to a specific route if tracking is tied to a route
    route_id = fields.Many2one('sales.route', string='Related Route')
