package interfaces

import (
	"net/http"
	"strconv"
	"time"
	"github.com/restaurant-platform/reservation-service/internal/application"
	reservation "github.com/restaurant-platform/reservation-service/internal/domain"

	"github.com/gin-gonic/gin"
)

type ReservationHandler struct {
	reservationService *application.ReservationService
}

func NewReservationHandler(reservationService *application.ReservationService) *ReservationHandler {
	return &ReservationHandler{
		reservationService: reservationService,
	}
}

func (h *ReservationHandler) CreateReservation(c *gin.Context) {
	var req application.CreateReservationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	res, err := h.reservationService.CreateReservation(
		c.Request.Context(), 
		req.CustomerID, 
		req.TableID, 
		req.DateTime, 
		req.PartySize,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, application.ReservationToResponse(res))
}

func (h *ReservationHandler) GetReservation(c *gin.Context) {
	id := reservation.ReservationID(c.Param("id"))
	
	res, err := h.reservationService.GetReservation(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, application.ReservationToResponse(res))
}

func (h *ReservationHandler) ListReservations(c *gin.Context) {
	offsetStr := c.DefaultQuery("offset", "0")
	limitStr := c.DefaultQuery("limit", "10")
	
	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid offset parameter"})
		return
	}
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid limit parameter"})
		return
	}

	reservations, total, err := h.reservationService.ListReservations(c.Request.Context(), offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var responses []*application.ReservationResponse
	for _, res := range reservations {
		responses = append(responses, application.ReservationToResponse(res))
	}

	response := application.ReservationListResponse{
		Reservations: responses,
		Total:        total,
		Offset:       offset,
		Limit:        limit,
	}

	c.JSON(http.StatusOK, response)
}

func (h *ReservationHandler) ConfirmReservation(c *gin.Context) {
	id := reservation.ReservationID(c.Param("id"))
	
	err := h.reservationService.ConfirmReservation(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reservation confirmed"})
}

func (h *ReservationHandler) CancelReservation(c *gin.Context) {
	id := reservation.ReservationID(c.Param("id"))
	
	err := h.reservationService.CancelReservation(c.Request.Context(), id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Reservation cancelled"})
}

func (h *ReservationHandler) GetReservationsByCustomer(c *gin.Context) {
	customerID := c.Param("customerId")
	
	reservations, err := h.reservationService.GetReservationsByCustomer(c.Request.Context(), customerID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var responses []*application.ReservationResponse
	for _, res := range reservations {
		responses = append(responses, application.ReservationToResponse(res))
	}

	c.JSON(http.StatusOK, responses)
}

func (h *ReservationHandler) FindAvailableTables(c *gin.Context) {
	dateTimeStr := c.Query("datetime")
	partySizeStr := c.Query("party_size")
	durationStr := c.DefaultQuery("duration", "2h")

	dateTime, err := time.Parse(time.RFC3339, dateTimeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid datetime format, use RFC3339"})
		return
	}

	partySize, err := strconv.Atoi(partySizeStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid party_size parameter"})
		return
	}

	duration, err := time.ParseDuration(durationStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid duration format"})
		return
	}

	tables, err := h.reservationService.FindAvailableTables(c.Request.Context(), dateTime, duration, partySize)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"available_tables": tables})
}