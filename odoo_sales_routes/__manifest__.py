{
    'name': 'Odoo Sales Routes',
    'version': '18.0.1.0.0',
    'category': 'Sales',
    'summary': 'Manage sales routes and track sales agents',
    'description': """
        This module allows managing sales routes and tracking sales agents via a mobile app.
        - Define Routes
        - Track GPS Location
        - Sync Offline Data
    """,
    'author': 'Antigravity',
    'depends': ['base', 'sale_management'],
    'data': [
        'security/ir.model.access.csv',
        'views/sales_route_views.xml',
        'views/sales_tracking_views.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
}
