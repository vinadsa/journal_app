package handler

import (
	"errors"
	"net/http"
	"strconv"

	"journal_app/internal/repository"
	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type SearchHandler struct {
	searchService *service.SearchService
}

func NewSearchHandler(searchService *service.SearchService) *SearchHandler {
	return &SearchHandler{searchService: searchService}
}

func (h *SearchHandler) SearchJournals(ctx *gin.Context) {
	keyword := ctx.Query("keyword")
	category := ctx.Query("category")
	tag := ctx.Query("tag")
	dateFrom := ctx.Query("date_from")
	dateTo := ctx.Query("date_to")
	limitStr := ctx.DefaultQuery("limit", "20")
	offsetStr := ctx.DefaultQuery("offset", "0")

	limit, _ := strconv.ParseInt(limitStr, 10, 32)
	offset, _ := strconv.ParseInt(offsetStr, 10, 32)

	journals, err := h.searchService.SearchJournals(ctx, repository.SearchParams{
		Keyword:  keyword,
		Category: category,
		Tag:      tag,
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Limit:    int32(limit),
		Offset:   int32(offset),
	})
	if err != nil {
		if errors.Is(err, repository.ErrUnauthorizedContext) {
			ctx.JSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to search journals", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"journals": journals,
		"count":    len(journals),
	})
}
