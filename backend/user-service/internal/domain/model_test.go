package domain

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// UserDomainTestSuite contains all domain model tests
type UserDomainTestSuite struct {
	suite.Suite
}

func TestUserDomainTestSuite(t *testing.T) {
	suite.Run(t, new(UserDomainTestSuite))
}

// Test User entity validation
func (suite *UserDomainTestSuite) TestUser_IsValid_Success() {
	// Given
	user := &User{
		ID:           NewUserID(),
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		RoleID:       NewRoleID(),
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := user.IsValid()

	// Then
	assert.NoError(suite.T(), err)
}

func (suite *UserDomainTestSuite) TestUser_IsValid_EmptyID() {
	// Given
	user := &User{
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		RoleID:       NewRoleID(),
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := user.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "user ID is required")
}

func (suite *UserDomainTestSuite) TestUser_IsValid_EmptyEmail() {
	// Given
	user := &User{
		ID:           NewUserID(),
		Email:        "",
		PasswordHash: "hashed_password",
		RoleID:       NewRoleID(),
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := user.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "email is required")
}

func (suite *UserDomainTestSuite) TestUser_IsValid_EmptyRoleID() {
	// Given
	user := &User{
		ID:           NewUserID(),
		Email:        "test@example.com",
		PasswordHash: "hashed_password",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := user.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "role ID is required")
}

// Test Role entity validation
func (suite *UserDomainTestSuite) TestRole_IsValid_Success() {
	// Given
	role := &Role{
		ID:          NewRoleID(),
		Name:        "test_role",
		Description: "Test role description",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// When
	err := role.IsValid()

	// Then
	assert.NoError(suite.T(), err)
}

func (suite *UserDomainTestSuite) TestRole_IsValid_EmptyID() {
	// Given
	role := &Role{
		Name:        "test_role",
		Description: "Test role description",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// When
	err := role.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "role ID is required")
}

func (suite *UserDomainTestSuite) TestRole_IsValid_EmptyName() {
	// Given
	role := &Role{
		ID:          NewRoleID(),
		Name:        "",
		Description: "Test role description",
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// When
	err := role.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "role name is required")
}

// Test Permission entity validation
func (suite *UserDomainTestSuite) TestPermission_IsValid_Success() {
	// Given
	permission := &Permission{
		ID:          NewPermissionID(),
		Name:        "test_permission",
		Resource:    ResourceMenu,
		Action:      ActionRead,
		Description: "Test permission description",
		CreatedAt:   time.Now(),
	}

	// When
	err := permission.IsValid()

	// Then
	assert.NoError(suite.T(), err)
}

func (suite *UserDomainTestSuite) TestPermission_IsValid_EmptyID() {
	// Given
	permission := &Permission{
		Name:        "test_permission",
		Resource:    ResourceMenu,
		Action:      ActionRead,
		Description: "Test permission description",
		CreatedAt:   time.Now(),
	}

	// When
	err := permission.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "permission ID is required")
}

func (suite *UserDomainTestSuite) TestPermission_IsValid_EmptyName() {
	// Given
	permission := &Permission{
		ID:          NewPermissionID(),
		Name:        "",
		Resource:    ResourceMenu,
		Action:      ActionRead,
		Description: "Test permission description",
		CreatedAt:   time.Now(),
	}

	// When
	err := permission.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "permission name, resource, and action are required")
}

func (suite *UserDomainTestSuite) TestPermission_IsValid_EmptyResource() {
	// Given
	permission := &Permission{
		ID:          NewPermissionID(),
		Name:        "test_permission",
		Resource:    "",
		Action:      ActionRead,
		Description: "Test permission description",
		CreatedAt:   time.Now(),
	}

	// When
	err := permission.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "permission name, resource, and action are required")
}

func (suite *UserDomainTestSuite) TestPermission_IsValid_EmptyAction() {
	// Given
	permission := &Permission{
		ID:          NewPermissionID(),
		Name:        "test_permission",
		Resource:    ResourceMenu,
		Action:      "",
		Description: "Test permission description",
		CreatedAt:   time.Now(),
	}

	// When
	err := permission.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "permission name, resource, and action are required")
}

// Test UserSession entity validation
func (suite *UserDomainTestSuite) TestUserSession_IsValid_Success() {
	// Given
	session := &UserSession{
		ID:           NewUserSessionID(),
		UserID:       NewUserID(),
		TokenHash:    "hashed_token",
		RefreshToken: "hashed_refresh_token",
		ExpiresAt:    time.Now().Add(time.Hour),
		IPAddress:    "192.168.1.1",
		UserAgent:    "Mozilla/5.0",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := session.IsValid()

	// Then
	assert.NoError(suite.T(), err)
}

func (suite *UserDomainTestSuite) TestUserSession_IsValid_EmptyID() {
	// Given
	session := &UserSession{
		UserID:       NewUserID(),
		TokenHash:    "hashed_token",
		RefreshToken: "hashed_refresh_token",
		ExpiresAt:    time.Now().Add(time.Hour),
		IPAddress:    "192.168.1.1",
		UserAgent:    "Mozilla/5.0",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := session.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "session ID is required")
}

func (suite *UserDomainTestSuite) TestUserSession_IsValid_EmptyUserID() {
	// Given
	session := &UserSession{
		ID:           NewUserSessionID(),
		TokenHash:    "hashed_token",
		RefreshToken: "hashed_refresh_token",
		ExpiresAt:    time.Now().Add(time.Hour),
		IPAddress:    "192.168.1.1",
		UserAgent:    "Mozilla/5.0",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := session.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "user ID is required")
}

func (suite *UserDomainTestSuite) TestUserSession_IsValid_EmptyTokenHash() {
	// Given
	session := &UserSession{
		ID:           NewUserSessionID(),
		UserID:       NewUserID(),
		TokenHash:    "",
		RefreshToken: "hashed_refresh_token",
		ExpiresAt:    time.Now().Add(time.Hour),
		IPAddress:    "192.168.1.1",
		UserAgent:    "Mozilla/5.0",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := session.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "token hash is required")
}

func (suite *UserDomainTestSuite) TestUserSession_IsValid_ExpiredSession() {
	// Given
	session := &UserSession{
		ID:           NewUserSessionID(),
		UserID:       NewUserID(),
		TokenHash:    "hashed_token",
		RefreshToken: "hashed_refresh_token",
		ExpiresAt:    time.Now().Add(-time.Hour), // Expired
		IPAddress:    "192.168.1.1",
		UserAgent:    "Mozilla/5.0",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	// When
	err := session.IsValid()

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "session has expired")
}

// Test User business logic methods
func (suite *UserDomainTestSuite) TestUser_CanAccess_WithDirectPermission() {
	// Given
	permissions := []Permission{
		{
			ID:       NewPermissionID(),
			Name:     "read_menu",
			Resource: ResourceMenu,
			Action:   ActionRead,
		},
		{
			ID:       NewPermissionID(),
			Name:     "create_order",
			Resource: ResourceOrder,
			Action:   ActionCreate,
		},
	}

	role := &Role{
		ID:          NewRoleID(),
		Name:        "test_role",
		Permissions: permissions,
	}

	user := &User{
		ID:     NewUserID(),
		Email:  "test@example.com",
		RoleID: role.ID,
		Role:   role,
	}

	// When & Then
	assert.True(suite.T(), user.CanAccess(ResourceMenu, ActionRead))
	assert.True(suite.T(), user.CanAccess(ResourceOrder, ActionCreate))
	assert.False(suite.T(), user.CanAccess(ResourceMenu, ActionDelete))
	assert.False(suite.T(), user.CanAccess(ResourceInventory, ActionRead))
}

func (suite *UserDomainTestSuite) TestUser_CanAccess_WithManagePermission() {
	// Given
	permissions := []Permission{
		{
			ID:       NewPermissionID(),
			Name:     "manage_menu",
			Resource: ResourceMenu,
			Action:   ActionManage, // Manage grants all actions
		},
	}

	role := &Role{
		ID:          NewRoleID(),
		Name:        "manager_role",
		Permissions: permissions,
	}

	user := &User{
		ID:     NewUserID(),
		Email:  "manager@example.com",
		RoleID: role.ID,
		Role:   role,
	}

	// When & Then - All actions should be allowed with manage permission
	assert.True(suite.T(), user.CanAccess(ResourceMenu, ActionRead))
	assert.True(suite.T(), user.CanAccess(ResourceMenu, ActionCreate))
	assert.True(suite.T(), user.CanAccess(ResourceMenu, ActionUpdate))
	assert.True(suite.T(), user.CanAccess(ResourceMenu, ActionDelete))
	assert.False(suite.T(), user.CanAccess(ResourceOrder, ActionRead)) // Different resource
}

func (suite *UserDomainTestSuite) TestUser_CanAccess_NoRole() {
	// Given
	user := &User{
		ID:    NewUserID(),
		Email: "test@example.com",
		Role:  nil, // No role assigned
	}

	// When & Then
	assert.False(suite.T(), user.CanAccess(ResourceMenu, ActionRead))
	assert.False(suite.T(), user.CanAccess(ResourceOrder, ActionCreate))
}

func (suite *UserDomainTestSuite) TestUser_HasRole_Success() {
	// Given
	role := &Role{
		ID:   NewRoleID(),
		Name: RoleManager,
	}

	user := &User{
		ID:     NewUserID(),
		Email:  "manager@example.com",
		RoleID: role.ID,
		Role:   role,
	}

	// When & Then
	assert.True(suite.T(), user.HasRole(RoleManager))
	assert.False(suite.T(), user.HasRole(RoleAdmin))
	assert.False(suite.T(), user.HasRole(RoleKitchen))
}

func (suite *UserDomainTestSuite) TestUser_HasRole_NoRole() {
	// Given
	user := &User{
		ID:    NewUserID(),
		Email: "test@example.com",
		Role:  nil,
	}

	// When & Then
	assert.False(suite.T(), user.HasRole(RoleManager))
	assert.False(suite.T(), user.HasRole(RoleAdmin))
}

func (suite *UserDomainTestSuite) TestUser_IsAdmin() {
	// Given
	adminRole := &Role{
		ID:   NewRoleID(),
		Name: RoleAdmin,
	}

	managerRole := &Role{
		ID:   NewRoleID(),
		Name: RoleManager,
	}

	adminUser := &User{
		ID:     NewUserID(),
		Email:  "admin@example.com",
		RoleID: adminRole.ID,
		Role:   adminRole,
	}

	managerUser := &User{
		ID:     NewUserID(),
		Email:  "manager@example.com",
		RoleID: managerRole.ID,
		Role:   managerRole,
	}

	// When & Then
	assert.True(suite.T(), adminUser.IsAdmin())
	assert.False(suite.T(), managerUser.IsAdmin())
}

// Test UserSession business logic methods
func (suite *UserDomainTestSuite) TestUserSession_IsExpired() {
	// Given
	expiredSession := &UserSession{
		ExpiresAt: time.Now().Add(-time.Hour), // 1 hour ago
	}

	validSession := &UserSession{
		ExpiresAt: time.Now().Add(time.Hour), // 1 hour from now
	}

	// When & Then
	assert.True(suite.T(), expiredSession.IsExpired())
	assert.False(suite.T(), validSession.IsExpired())
}

func (suite *UserDomainTestSuite) TestUserSession_IsValidSession() {
	// Given
	validActiveSession := &UserSession{
		ExpiresAt: time.Now().Add(time.Hour),
		IsActive:  true,
	}

	validInactiveSession := &UserSession{
		ExpiresAt: time.Now().Add(time.Hour),
		IsActive:  false,
	}

	expiredActiveSession := &UserSession{
		ExpiresAt: time.Now().Add(-time.Hour),
		IsActive:  true,
	}

	// When & Then
	assert.True(suite.T(), validActiveSession.IsValidSession())
	assert.False(suite.T(), validInactiveSession.IsValidSession())
	assert.False(suite.T(), expiredActiveSession.IsValidSession())
}

// Test ID generation functions
func (suite *UserDomainTestSuite) TestNewUserID_GeneratesValidID() {
	// When
	userID := NewUserID()

	// Then
	assert.NotEmpty(suite.T(), userID)
	assert.Contains(suite.T(), userID.String(), "user_")
	assert.False(suite.T(), userID.IsEmpty())
}

func (suite *UserDomainTestSuite) TestNewRoleID_GeneratesValidID() {
	// When
	roleID := NewRoleID()

	// Then
	assert.NotEmpty(suite.T(), roleID)
	assert.Contains(suite.T(), roleID.String(), "role_")
	assert.False(suite.T(), roleID.IsEmpty())
}

func (suite *UserDomainTestSuite) TestNewPermissionID_GeneratesValidID() {
	// When
	permissionID := NewPermissionID()

	// Then
	assert.NotEmpty(suite.T(), permissionID)
	assert.Contains(suite.T(), permissionID.String(), "perm_")
	assert.False(suite.T(), permissionID.IsEmpty())
}

func (suite *UserDomainTestSuite) TestNewUserSessionID_GeneratesValidID() {
	// When
	sessionID := NewUserSessionID()

	// Then
	assert.NotEmpty(suite.T(), sessionID)
	assert.Contains(suite.T(), sessionID.String(), "session_")
	assert.False(suite.T(), sessionID.IsEmpty())
}

// Test unique ID generation
func (suite *UserDomainTestSuite) TestID_Generation_IsUnique() {
	// When
	ids := make([]string, 100)
	for i := 0; i < 100; i++ {
		ids[i] = NewUserID().String()
		time.Sleep(1 * time.Microsecond) // Ensure different timestamps
	}

	// Then - All IDs should be unique
	uniqueIds := make(map[string]bool)
	for _, id := range ids {
		assert.False(suite.T(), uniqueIds[id], "Duplicate ID found: %s", id)
		uniqueIds[id] = true
	}
	assert.Len(suite.T(), uniqueIds, 100)
}

// Test helper function NewUserWithRole
func (suite *UserDomainTestSuite) TestNewUserWithRole_CreatesValidUser() {
	// Given
	email := "test@example.com"
	passwordHash := "hashed_password_123"
	role := &Role{
		ID:          NewRoleID(),
		Name:        RoleManager,
		Description: "Manager role",
	}

	// When
	user := NewUserWithRole(email, passwordHash, role)

	// Then
	assert.NotNil(suite.T(), user)
	assert.NotEmpty(suite.T(), user.ID)
	assert.Equal(suite.T(), email, user.Email)
	assert.Equal(suite.T(), passwordHash, user.PasswordHash)
	assert.Equal(suite.T(), role.ID, user.RoleID)
	assert.Equal(suite.T(), role, user.Role)
	assert.True(suite.T(), user.IsActive)
	assert.False(suite.T(), user.CreatedAt.IsZero())
	assert.False(suite.T(), user.UpdatedAt.IsZero())
}

// Test GetDefaultRoles function
func (suite *UserDomainTestSuite) TestGetDefaultRoles_ReturnsAllRoles() {
	// When
	roles := GetDefaultRoles()

	// Then
	assert.Len(suite.T(), roles, 6) // admin, manager, kitchen, waitstaff, host, cashier

	roleNames := make([]string, len(roles))
	for i, role := range roles {
		roleNames[i] = role.Name
		assert.NotEmpty(suite.T(), role.ID)
		assert.NotEmpty(suite.T(), role.Name)
		assert.NotEmpty(suite.T(), role.Description)
		assert.False(suite.T(), role.CreatedAt.IsZero())
		assert.False(suite.T(), role.UpdatedAt.IsZero())
	}

	// Verify all expected roles are present
	expectedRoles := []string{RoleAdmin, RoleManager, RoleKitchen, RoleWaitstaff, RoleHost, RoleCashier}
	for _, expectedRole := range expectedRoles {
		assert.Contains(suite.T(), roleNames, expectedRole)
	}
}

// Test role constants
func (suite *UserDomainTestSuite) TestRoleConstants_AreValid() {
	assert.Equal(suite.T(), "admin", RoleAdmin)
	assert.Equal(suite.T(), "manager", RoleManager)
	assert.Equal(suite.T(), "kitchen_staff", RoleKitchen)
	assert.Equal(suite.T(), "waitstaff", RoleWaitstaff)
	assert.Equal(suite.T(), "host", RoleHost)
	assert.Equal(suite.T(), "cashier", RoleCashier)
}

// Test resource constants
func (suite *UserDomainTestSuite) TestResourceConstants_AreValid() {
	assert.Equal(suite.T(), "menu", ResourceMenu)
	assert.Equal(suite.T(), "order", ResourceOrder)
	assert.Equal(suite.T(), "kitchen", ResourceKitchen)
	assert.Equal(suite.T(), "reservation", ResourceReservation)
	assert.Equal(suite.T(), "inventory", ResourceInventory)
	assert.Equal(suite.T(), "user", ResourceUser)
	assert.Equal(suite.T(), "report", ResourceReport)
}

// Test action constants
func (suite *UserDomainTestSuite) TestActionConstants_AreValid() {
	assert.Equal(suite.T(), "create", ActionCreate)
	assert.Equal(suite.T(), "read", ActionRead)
	assert.Equal(suite.T(), "update", ActionUpdate)
	assert.Equal(suite.T(), "delete", ActionDelete)
	assert.Equal(suite.T(), "manage", ActionManage)
	assert.Equal(suite.T(), "view", ActionView)
}

// Test validation error creation
func (suite *UserDomainTestSuite) TestNewValidationError_CreatesProperError() {
	// Given
	message := "test validation error"

	// When
	err := NewValidationError(message)

	// Then
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), message)
}

// Test complex permission scenarios
func (suite *UserDomainTestSuite) TestComplexPermissionScenarios() {
	// Given - Create a realistic admin user with multiple permissions
	adminPermissions := []Permission{
		{ID: NewPermissionID(), Resource: ResourceMenu, Action: ActionManage},
		{ID: NewPermissionID(), Resource: ResourceOrder, Action: ActionManage},
		{ID: NewPermissionID(), Resource: ResourceUser, Action: ActionManage},
		{ID: NewPermissionID(), Resource: ResourceReport, Action: ActionView},
	}

	adminRole := &Role{
		ID:          NewRoleID(),
		Name:        RoleAdmin,
		Permissions: adminPermissions,
	}

	admin := &User{
		ID:     NewUserID(),
		Email:  "admin@restaurant.com",
		RoleID: adminRole.ID,
		Role:   adminRole,
	}

	// Test admin can manage everything they have permissions for
	assert.True(suite.T(), admin.CanAccess(ResourceMenu, ActionCreate))
	assert.True(suite.T(), admin.CanAccess(ResourceMenu, ActionRead))
	assert.True(suite.T(), admin.CanAccess(ResourceMenu, ActionUpdate))
	assert.True(suite.T(), admin.CanAccess(ResourceMenu, ActionDelete))
	assert.True(suite.T(), admin.CanAccess(ResourceOrder, ActionManage))
	assert.True(suite.T(), admin.CanAccess(ResourceReport, ActionView))

	// Test admin cannot access resources without permissions
	assert.False(suite.T(), admin.CanAccess(ResourceInventory, ActionRead))
	assert.False(suite.T(), admin.CanAccess(ResourceKitchen, ActionManage))

	// Given - Create a kitchen staff user with limited permissions
	kitchenPermissions := []Permission{
		{ID: NewPermissionID(), Resource: ResourceOrder, Action: ActionRead},
		{ID: NewPermissionID(), Resource: ResourceOrder, Action: ActionUpdate},
		{ID: NewPermissionID(), Resource: ResourceKitchen, Action: ActionManage},
		{ID: NewPermissionID(), Resource: ResourceInventory, Action: ActionRead},
	}

	kitchenRole := &Role{
		ID:          NewRoleID(),
		Name:        RoleKitchen,
		Permissions: kitchenPermissions,
	}

	kitchenStaff := &User{
		ID:     NewUserID(),
		Email:  "kitchen@restaurant.com",
		RoleID: kitchenRole.ID,
		Role:   kitchenRole,
	}

	// Test kitchen staff permissions
	assert.True(suite.T(), kitchenStaff.CanAccess(ResourceOrder, ActionRead))
	assert.True(suite.T(), kitchenStaff.CanAccess(ResourceOrder, ActionUpdate))
	assert.True(suite.T(), kitchenStaff.CanAccess(ResourceKitchen, ActionCreate)) // Manage allows all
	assert.True(suite.T(), kitchenStaff.CanAccess(ResourceInventory, ActionRead))

	// Test kitchen staff cannot access restricted resources
	assert.False(suite.T(), kitchenStaff.CanAccess(ResourceUser, ActionRead))
	assert.False(suite.T(), kitchenStaff.CanAccess(ResourceMenu, ActionUpdate))
	assert.False(suite.T(), kitchenStaff.CanAccess(ResourceOrder, ActionDelete))
}

// Test session lifecycle
func (suite *UserDomainTestSuite) TestSessionLifecycle() {
	// Given
	userID := NewUserID()
	sessionID := NewUserSessionID()
	now := time.Now()

	// Test new session
	session := &UserSession{
		ID:           sessionID,
		UserID:       userID,
		TokenHash:    "hash123",
		RefreshToken: "refresh123",
		ExpiresAt:    now.Add(time.Hour),
		IPAddress:    "192.168.1.100",
		UserAgent:    "Test Browser",
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Test session is valid when created
	assert.NoError(suite.T(), session.IsValid())
	assert.True(suite.T(), session.IsValidSession())
	assert.False(suite.T(), session.IsExpired())

	// Test session after deactivation
	session.IsActive = false
	assert.False(suite.T(), session.IsValidSession()) // Inactive
	assert.False(suite.T(), session.IsExpired())      // Still not expired

	// Test session after expiration
	session.IsActive = true
	session.ExpiresAt = now.Add(-time.Hour) // Expired
	assert.False(suite.T(), session.IsValidSession()) // Invalid due to expiration
	assert.True(suite.T(), session.IsExpired())

	// Test validation catches expired session
	err := session.IsValid()
	assert.Error(suite.T(), err)
	assert.Contains(suite.T(), err.Error(), "session has expired")
}