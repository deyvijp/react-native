from odoo import http
from odoo.http import request
import json
import logging

_logger = logging.getLogger(__name__)

class SalesRouteController(http.Controller):

    @http.route('/api/v1/tracking/update', type='json', auth='user', methods=['POST'])
    def update_tracking(self, **kwargs):
        """
        Receive tracking data from mobile app.
        Expected JSON payload:
        {
            "latitude": float,
            "longitude": float,
            "timestamp": "YYYY-MM-DD HH:MM:SS",
            "battery_level": float,
            "speed": float,
            "heading": float
        }
        """
        try:
            user = request.env.user
            data = request.get_json_data()
            
            # Basic validation
            if not data.get('latitude') or not data.get('longitude'):
                return {'status': 'error', 'message': 'Missing coordinates'}

            # Create tracking record
            request.env['sales.tracking'].create({
                'user_id': user.id,
                'latitude': data.get('latitude'),
                'longitude': data.get('longitude'),
                'timestamp': data.get('timestamp'), # Ensure format matches or parse it
                'battery_level': data.get('battery_level'),
                'speed': data.get('speed'),
                'heading': data.get('heading'),
            })
            
            return {'status': 'success', 'message': 'Tracking saved'}
            
        except Exception as e:
            _logger.error(f"Tracking Update Error: {str(e)}")
            return {'status': 'error', 'message': str(e)}
