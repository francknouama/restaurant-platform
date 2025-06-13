package interfaces

import (
	"errors"
	"net/http"
	
	"github.com/gin-gonic/gin"
	sharedErrors "github.com/restaurant-platform/shared/pkg/errors"
)

// ErrorResponse represents a structured error response using Go 1.24.4 features
type ErrorResponse struct {
	Error   string         `json:"error"`
	Message string         `json:"message"`
	Code    string         `json:"code,omitempty"`
	Context map[string]any `json:"context,omitempty"`
}

// handleError provides centralized error handling with Go 1.24.4 enhanced error handling
func handleError(c *gin.Context, err error) {
	var statusCode int
	var response ErrorResponse

	// Check for domain errors first
	var domainErr *sharedErrors.DomainError
	if errors.As(err, &domainErr) {
		response = ErrorResponse{
			Error:   domainErr.Message,
			Message: domainErr.Error(),
			Code:    domainErr.Code,
			Context: domainErr.Context,
		}
		
		switch domainErr.Code {
		case "NOT_FOUND":
			statusCode = http.StatusNotFound
		case "VALIDATION_FAILED":
			statusCode = http.StatusBadRequest
		case "CONFLICT":
			statusCode = http.StatusConflict
		default:
			statusCode = http.StatusInternalServerError
		}
	} else {
		// Use modern error checking with errors.Is
		switch {
		case sharedErrors.IsNotFound(err):
			statusCode = http.StatusNotFound
			response = ErrorResponse{
				Error:   "Resource not found",
				Message: err.Error(),
				Code:    "NOT_FOUND",
			}
		case sharedErrors.IsValidationError(err):
			statusCode = http.StatusBadRequest
			response = ErrorResponse{
				Error:   "Validation failed",
				Message: err.Error(),
				Code:    "VALIDATION_FAILED",
			}
		case sharedErrors.IsConflictError(err):
			statusCode = http.StatusConflict
			response = ErrorResponse{
				Error:   "Operation conflict",
				Message: err.Error(),
				Code:    "CONFLICT",
			}
		case sharedErrors.IsUnauthorizedError(err):
			statusCode = http.StatusUnauthorized
			response = ErrorResponse{
				Error:   "Unauthorized access",
				Message: err.Error(),
				Code:    "UNAUTHORIZED",
			}
		default:
			statusCode = http.StatusInternalServerError
			response = ErrorResponse{
				Error:   "Internal server error",
				Message: "An unexpected error occurred",
				Code:    "INTERNAL_ERROR",
			}
		}
	}

	c.JSON(statusCode, response)
}

// handleValidationError specifically handles request validation errors
func handleValidationError(c *gin.Context, err error) {
	response := ErrorResponse{
		Error:   "Request validation failed",
		Message: err.Error(),
		Code:    "VALIDATION_FAILED",
		Context: map[string]any{
			"type": "request_validation",
		},
	}
	c.JSON(http.StatusBadRequest, response)
}

// handleSuccess provides consistent success response formatting
func handleSuccess[T any](c *gin.Context, statusCode int, data T) {
	c.JSON(statusCode, data)
}

// handleCreated provides consistent created response formatting
func handleCreated[T any](c *gin.Context, data T) {
	handleSuccess(c, http.StatusCreated, data)
}

// handleOK provides consistent OK response formatting
func handleOK[T any](c *gin.Context, data T) {
	handleSuccess(c, http.StatusOK, data)
}

// handleNoContent provides consistent no content response
func handleNoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}