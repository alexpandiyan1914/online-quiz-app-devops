import logging
import sys
from datetime import datetime, timezone


class SafeFormatter(logging.Formatter):
    """
    Format logs cleanly for local development and cloud logging (Cloud Run).
    Ensures timestamp, level, and message are clear and structured.
    """
    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.now(timezone.utc).isoformat()
        log_entry = f"[{timestamp}] [{record.levelname:<7}] [{record.name}] {record.getMessage()}"
        if record.exc_info:
            log_entry += "\n" + self.formatException(record.exc_info)
        return log_entry


def setup_logging():
    logger = logging.getLogger("quiz_app")
    logger.setLevel(logging.INFO)

    # Avoid adding duplicate handlers if already present
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(SafeFormatter())
        logger.addHandler(handler)

    # Also configure root logger at INFO
    logging.basicConfig(level=logging.INFO, handlers=[logger.handlers[0]] if logger.handlers else None)
    return logger


logger = setup_logging()
