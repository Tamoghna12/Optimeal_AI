"""
Enhanced logging configuration for the Homeland Meals API
"""
import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

class ColoredFormatter(logging.Formatter):
    """Custom formatter with colors for different log levels"""
    
    # Color codes
    COLORS = {
        'DEBUG': '\033[36m',      # Cyan
        'INFO': '\033[32m',       # Green
        'WARNING': '\033[33m',    # Yellow
        'ERROR': '\033[31m',      # Red
        'CRITICAL': '\033[35m',   # Magenta
        'RESET': '\033[0m'        # Reset
    }
    
    def format(self, record):
        # Add color to levelname
        levelname = record.levelname
        if levelname in self.COLORS:
            colored_levelname = f"{self.COLORS[levelname]}{levelname}{self.COLORS['RESET']}"
            record.levelname = colored_levelname
        
        # Format the message
        formatted = super().format(record)
        
        # Reset record.levelname for other handlers
        record.levelname = levelname
        
        return formatted

class APILogger:
    """Enhanced logger for the Homeland Meals API"""
    
    def __init__(self, name: str = "homeland_meals"):
        self.name = name
        self.logger = logging.getLogger(name)
        self._configured = False
    
    def setup(self, log_level: str = "INFO", log_file: Optional[Path] = None):
        """Setup logging configuration"""
        if self._configured:
            return
        
        # Clear any existing handlers
        self.logger.handlers.clear()
        
        # Set log level
        level = getattr(logging, log_level.upper(), logging.INFO)
        self.logger.setLevel(level)
        
        # Create formatters
        detailed_format = "%(asctime)s | %(name)s | %(levelname)s | %(filename)s:%(lineno)d | %(message)s"
        simple_format = "%(levelname)s | %(message)s"
        
        # Console handler with colors
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_formatter = ColoredFormatter(simple_format)
        console_handler.setFormatter(console_formatter)
        self.logger.addHandler(console_handler)
        
        # File handler if log file specified
        if log_file:
            log_file.parent.mkdir(parents=True, exist_ok=True)
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(logging.DEBUG)  # Always log debug to file
            file_formatter = logging.Formatter(detailed_format)
            file_handler.setFormatter(file_formatter)
            self.logger.addHandler(file_handler)
        
        # Configure third-party loggers
        self._configure_third_party_loggers()
        
        self._configured = True
        self.logger.info(f"Logging initialized - Level: {log_level}")
    
    def _configure_third_party_loggers(self):
        """Configure third-party library loggers"""
        # Set appropriate levels for third-party loggers
        logging.getLogger("uvicorn").setLevel(logging.INFO)
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
        logging.getLogger("fastapi").setLevel(logging.INFO)
        logging.getLogger("motor").setLevel(logging.WARNING)
        logging.getLogger("pymongo").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)
        logging.getLogger("PIL").setLevel(logging.WARNING)
    
    def log_request(self, method: str, url: str, user_id: Optional[str] = None, **kwargs):
        """Log API request"""
        extra_info = " | ".join([f"{k}={v}" for k, v in kwargs.items() if v is not None])
        user_info = f"User: {user_id}" if user_id else "Anonymous"
        message = f"{method} {url} | {user_info}"
        if extra_info:
            message += f" | {extra_info}"
        
        self.logger.info(message)
    
    def log_response(self, status_code: int, response_time_ms: float, **kwargs):
        """Log API response"""
        extra_info = " | ".join([f"{k}={v}" for k, v in kwargs.items() if v is not None])
        message = f"Response: {status_code} | Time: {response_time_ms:.2f}ms"
        if extra_info:
            message += f" | {extra_info}"
        
        if status_code >= 400:
            self.logger.error(message)
        elif status_code >= 300:
            self.logger.warning(message)
        else:
            self.logger.info(message)
    
    def log_database_operation(self, operation: str, collection: str, result: Optional[str] = None):
        """Log database operations"""
        message = f"DB: {operation} on {collection}"
        if result:
            message += f" | Result: {result}"
        
        self.logger.debug(message)
    
    def log_ai_request(self, operation: str, model: str, tokens_used: Optional[int] = None):
        """Log AI/LLM requests"""
        message = f"AI: {operation} using {model}"
        if tokens_used:
            message += f" | Tokens: {tokens_used}"
        
        self.logger.info(message)
    
    def log_error(self, error: Exception, context: Optional[str] = None, **kwargs):
        """Log errors with context"""
        error_type = type(error).__name__
        error_msg = str(error)
        
        message = f"ERROR: {error_type} - {error_msg}"
        if context:
            message = f"{context} | {message}"
        
        extra_info = " | ".join([f"{k}={v}" for k, v in kwargs.items() if v is not None])
        if extra_info:
            message += f" | {extra_info}"
        
        self.logger.error(message, exc_info=True)
    
    def log_performance_metric(self, metric_name: str, value: float, unit: str = "ms", **kwargs):
        """Log performance metrics"""
        extra_info = " | ".join([f"{k}={v}" for k, v in kwargs.items() if v is not None])
        message = f"PERF: {metric_name} = {value:.2f}{unit}"
        if extra_info:
            message += f" | {extra_info}"
        
        self.logger.info(message)
    
    def log_user_action(self, user_id: str, action: str, resource: str, **kwargs):
        """Log user actions for audit trail"""
        extra_info = " | ".join([f"{k}={v}" for k, v in kwargs.items() if v is not None])
        message = f"USER_ACTION: {user_id} {action} {resource}"
        if extra_info:
            message += f" | {extra_info}"
        
        self.logger.info(message)
    
    def get_logger(self) -> logging.Logger:
        """Get the underlying logger instance"""
        return self.logger

# Global logger instance
api_logger = APILogger()

def setup_logging(log_level: str = "INFO", log_file: Optional[Path] = None):
    """Setup global logging"""
    api_logger.setup(log_level, log_file)

def get_logger(name: str = None) -> logging.Logger:
    """Get a logger instance"""
    if name:
        return logging.getLogger(f"homeland_meals.{name}")
    return api_logger.get_logger()

# Convenience functions
def log_request(*args, **kwargs):
    """Log API request"""
    api_logger.log_request(*args, **kwargs)

def log_response(*args, **kwargs):
    """Log API response"""
    api_logger.log_response(*args, **kwargs)

def log_error(*args, **kwargs):
    """Log error with context"""
    api_logger.log_error(*args, **kwargs)

def log_performance(*args, **kwargs):
    """Log performance metric"""
    api_logger.log_performance_metric(*args, **kwargs)

def log_user_action(*args, **kwargs):
    """Log user action"""
    api_logger.log_user_action(*args, **kwargs)