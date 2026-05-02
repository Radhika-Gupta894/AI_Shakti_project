from database.base import Base
from .user import User
from .tender import Tender
from .bidder import Bidder, BidderDocument
from .evaluation import Evaluation
from .audit_log import AuditLog
from .fraud_alert import FraudAlert
from .manual_review import ManualReview
from .clarification import ClarificationRequest

# This allows Base.metadata.create_all to find all models
