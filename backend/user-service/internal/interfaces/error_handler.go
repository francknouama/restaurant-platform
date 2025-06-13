package interfaces

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/restaurant-platform/shared/pkg/errors"
	"github.com/restaurant-platform/user-service/internal/application"
)

// HTTP status mappings for domain errors
func getHTTPStatusFromError(err error) int {
	if errors.IsNotFound(err) {
		return http.StatusNotFound
	}
	if errors.IsValidationError(err) {
		return http.StatusBadRequest
	}
	if errors.IsConflictError(err) {
		return http.StatusConflict
	}
	if errors.IsUnauthorizedError(err) {
		return http.StatusUnauthorized
	}

	// Check for domain-specific errors
	if domainErr, ok := err.(*errors.DomainError); ok {
		switch domainErr.Code {
		case "INVALID_CREDENTIALS":
			return http.StatusUnauthorized
		case "ACCOUNT_DISABLED":
			return http.StatusForbidden
		case "SESSION_NOT_FOUND", "SESSION_INVALID":
			return http.StatusUnauthorized
		case "INVALID_TOKEN", "TOKEN_MISMATCH":
			return http.StatusUnauthorized
		case "VALIDATION_FAILED":
			return http.StatusBadRequest
		case "NOT_FOUND":
			return http.StatusNotFound
		case "CONFLICT":
			return http.StatusConflict
		default:
			return http.StatusInternalServerError
		}
	}

	return http.StatusInternalServerError
}

// Error response handlers
func handleError(c *gin.Context, err error) {
	status := getHTTPStatusFromError(err)
	
	// Extract user-friendly message
	message := err.Error()
	if domainErr, ok := err.(*errors.DomainError); ok {
		message = domainErr.Message
	}

	response := application.ErrorResponse(message)
	c.JSON(status, response)
}

func handleValidationError(c *gin.Context, err error) {
	response := application.ErrorResponse("Invalid request data: " + err.Error())
	c.JSON(http.StatusBadRequest, response)
}

func handleBadRequest(c *gin.Context, message string) {
	response := application.ErrorResponse(message)
	c.JSON(http.StatusBadRequest, response)
}

func handleUnauthorized(c *gin.Context, message string) {
	response := application.ErrorResponse(message)
	c.JSON(http.StatusUnauthorized, response)
}

func handleForbidden(c *gin.Context, message string) {
	response := application.ErrorResponse(message)
	c.JSON(http.StatusForbidden, response)
}

func handleNotFound(c *gin.Context, message string) {
	response := application.ErrorResponse(message)
	c.JSON(http.StatusNotFound, response)
}

func handleConflict(c *gin.Context, message string) {
	response := application.ErrorResponse(message)
	c.JSON(http.StatusConflict, response)
}

func handleInternalServerError(c *gin.Context, message string) {
	response := application.ErrorResponse(message)
	c.JSON(http.StatusInternalServerError, response)
}

// Success response handlers
func handleOK(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, data)
}

func handleCreated(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, data)
}

func handleNoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}