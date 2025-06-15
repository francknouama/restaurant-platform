package interfaces

import (
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/restaurant-platform/user-service/internal/application"
	"github.com/restaurant-platform/user-service/internal/domain"
)

type AuthHandler struct {
	authService domain.AuthenticationService
}

func NewAuthHandler(authService domain.AuthenticationService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// Authentication endpoints
func (h *AuthHandler) Register(c *gin.Context) {
	var req application.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// Parse role ID
	roleID, err := application.ParseRoleID(req.RoleID)
	if err != nil {
		handleBadRequest(c, "Invalid role ID format")
		return
	}

	// Register user
	userWithRole, err := h.authService.Register(c.Request.Context(), req.Email, req.Password, roleID)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.UserWithRoleToResponse(userWithRole)
	handleCreated(c, application.SuccessMessage(response, "User registered successfully"))
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req application.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// Get client info
	ipAddress := getClientIP(c)
	userAgent := c.GetHeader("User-Agent")

	// Login user
	authResult, err := h.authService.Login(c.Request.Context(), req.Email, req.Password, ipAddress, userAgent)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.AuthResultToResponse(authResult)
	handleOK(c, application.SuccessMessage(response, "Login successful"))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Get session ID from JWT claims (set by auth middleware)
	sessionIDStr, exists := c.Get("sessionID")
	if !exists {
		handleUnauthorized(c, "Session not found")
		return
	}

	sessionID, err := application.ParseUserSessionID(sessionIDStr.(string))
	if err != nil {
		handleBadRequest(c, "Invalid session ID")
		return
	}

	// Logout user
	err = h.authService.Logout(c.Request.Context(), sessionID)
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.SuccessMessage(nil, "Logout successful"))
}

func (h *AuthHandler) RefreshToken(c *gin.Context) {
	var req application.RefreshTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// Refresh token
	authResult, err := h.authService.RefreshToken(c.Request.Context(), req.RefreshToken)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.AuthResultToResponse(authResult)
	handleOK(c, application.SuccessMessage(response, "Token refreshed successfully"))
}

func (h *AuthHandler) ValidateToken(c *gin.Context) {
	// Get token from Authorization header
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		handleBadRequest(c, "Authorization header required")
		return
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	if tokenString == authHeader {
		handleBadRequest(c, "Bearer token required")
		return
	}

	// Validate token
	userWithRole, err := h.authService.ValidateToken(c.Request.Context(), tokenString)
	if err != nil {
		response := application.TokenValidationResponse{
			Valid: false,
		}
		handleOK(c, application.SuccessResponse(response))
		return
	}

	userResponse := application.UserWithRoleToResponse(userWithRole)
	response := application.TokenValidationResponse{
		Valid: true,
		User:  &userResponse,
	}
	handleOK(c, application.SuccessResponse(response))
}

func (h *AuthHandler) GetProfile(c *gin.Context) {
	// Get user ID from JWT claims (set by auth middleware)
	userIDStr, exists := c.Get("userID")
	if !exists {
		handleUnauthorized(c, "User not found in context")
		return
	}

	userID, err := application.ParseUserID(userIDStr.(string))
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	// Get user profile
	userWithRole, err := h.authService.GetUser(c.Request.Context(), userID)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.UserWithRoleToResponse(userWithRole)
	handleOK(c, application.SuccessResponse(response))
}

func (h *AuthHandler) ChangePassword(c *gin.Context) {
	var req application.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// Get user ID from JWT claims (set by auth middleware)
	userIDStr, exists := c.Get("userID")
	if !exists {
		handleUnauthorized(c, "User not found in context")
		return
	}

	userID, err := application.ParseUserID(userIDStr.(string))
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	// Change password
	err = h.authService.ChangePassword(c.Request.Context(), userID, req.OldPassword, req.NewPassword)
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.SuccessMessage(nil, "Password changed successfully"))
}

// User management endpoints (admin only)
func (h *AuthHandler) GetUsers(c *gin.Context) {
	// Parse pagination parameters
	page := 1
	pageSize := 20
	
	if pageStr := c.Query("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}
	
	if pageSizeStr := c.Query("pageSize"); pageSizeStr != "" {
		if ps, err := strconv.Atoi(pageSizeStr); err == nil && ps > 0 && ps <= 100 {
			pageSize = ps
		}
	}
	
	// Build filters
	filters := domain.UserFilters{
		Limit:  pageSize,
		Offset: (page - 1) * pageSize,
	}
	
	// Apply optional filters
	if roleID := c.Query("roleId"); roleID != "" {
		if rid, err := application.ParseRoleID(roleID); err == nil {
			filters.RoleID = &rid
		}
	}
	
	if email := c.Query("email"); email != "" {
		filters.Email = email
	}
	
	if activeStr := c.Query("active"); activeStr != "" {
		if active, err := strconv.ParseBool(activeStr); err == nil {
			filters.IsActive = &active
		}
	}
	
	// Get users
	users, err := h.authService.ListUsers(c.Request.Context(), filters)
	if err != nil {
		handleError(c, err)
		return
	}
	
	// Convert to response
	response := make([]application.UserWithRoleResponse, 0, len(users))
	for _, user := range users {
		response = append(response, application.UserWithRoleToResponse(user))
	}
	
	// Return paginated response
	handleOK(c, application.PaginatedResponse{
		Data: response,
		Page: page,
		PageSize: pageSize,
		Total: len(response),
	})
}

func (h *AuthHandler) GetUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := application.ParseUserID(userIDStr)
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	userWithRole, err := h.authService.GetUser(c.Request.Context(), userID)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.UserWithRoleToResponse(userWithRole)
	handleOK(c, application.SuccessResponse(response))
}

func (h *AuthHandler) UpdateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := application.ParseUserID(userIDStr)
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	var req application.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	// Convert to domain updates
	updates := domain.UserUpdates{
		Email:    req.Email,
		IsActive: req.IsActive,
	}

	if req.RoleID != nil {
		roleID, err := application.ParseRoleID(*req.RoleID)
		if err != nil {
			handleBadRequest(c, "Invalid role ID format")
			return
		}
		updates.RoleID = &roleID
	}

	userWithRole, err := h.authService.UpdateUser(c.Request.Context(), userID, updates)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.UserWithRoleToResponse(userWithRole)
	handleOK(c, application.SuccessMessage(response, "User updated successfully"))
}

func (h *AuthHandler) ActivateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := application.ParseUserID(userIDStr)
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	err = h.authService.ActivateUser(c.Request.Context(), userID)
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.SuccessMessage(nil, "User activated successfully"))
}

func (h *AuthHandler) DeactivateUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := application.ParseUserID(userIDStr)
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	err = h.authService.DeactivateUser(c.Request.Context(), userID)
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.SuccessMessage(nil, "User deactivated successfully"))
}

func (h *AuthHandler) AssignRole(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := application.ParseUserID(userIDStr)
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	var req application.AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		handleValidationError(c, err)
		return
	}

	roleID, err := application.ParseRoleID(req.RoleID)
	if err != nil {
		handleBadRequest(c, "Invalid role ID format")
		return
	}

	err = h.authService.AssignRole(c.Request.Context(), userID, roleID)
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.SuccessMessage(nil, "Role assigned successfully"))
}

// Role and permission endpoints
func (h *AuthHandler) GetRoles(c *gin.Context) {
	roles, err := h.authService.GetRoles(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.RolesToResponse(roles)
	handleOK(c, application.SuccessResponse(response))
}

func (h *AuthHandler) GetPermissions(c *gin.Context) {
	permissions, err := h.authService.GetPermissions(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.PermissionsToResponse(permissions)
	handleOK(c, application.SuccessResponse(response))
}

// Session management endpoints
func (h *AuthHandler) GetUserSessions(c *gin.Context) {
	// Get user ID from JWT claims (set by auth middleware)
	userIDStr, exists := c.Get("userID")
	if !exists {
		handleUnauthorized(c, "User not found in context")
		return
	}

	userID, err := application.ParseUserID(userIDStr.(string))
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	sessions, err := h.authService.GetUserSessions(c.Request.Context(), userID)
	if err != nil {
		handleError(c, err)
		return
	}

	response := application.SessionsToResponse(sessions)
	handleOK(c, application.SuccessResponse(response))
}

func (h *AuthHandler) InvalidateAllSessions(c *gin.Context) {
	// Get user ID from JWT claims (set by auth middleware)
	userIDStr, exists := c.Get("userID")
	if !exists {
		handleUnauthorized(c, "User not found in context")
		return
	}

	userID, err := application.ParseUserID(userIDStr.(string))
	if err != nil {
		handleBadRequest(c, "Invalid user ID")
		return
	}

	err = h.authService.InvalidateUserSessions(c.Request.Context(), userID)
	if err != nil {
		handleError(c, err)
		return
	}

	handleOK(c, application.SuccessMessage(nil, "All sessions invalidated successfully"))
}

// Helper functions
func getClientIP(c *gin.Context) string {
	// Check X-Forwarded-For header first (for proxies)
	if xff := c.GetHeader("X-Forwarded-For"); xff != "" {
		// Take the first IP if multiple are present
		if ips := strings.Split(xff, ","); len(ips) > 0 {
			return strings.TrimSpace(ips[0])
		}
	}

	// Check X-Real-IP header
	if xri := c.GetHeader("X-Real-IP"); xri != "" {
		return xri
	}

	// Fall back to RemoteAddr
	return c.ClientIP()
}