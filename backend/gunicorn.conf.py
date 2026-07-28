import os

# Render supplies PORT at runtime. Keep 8000 as the local Docker default.
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = 3
worker_class = "sync"
timeout = 120
accesslog = "-"
errorlog = "-"
loglevel = "info"
