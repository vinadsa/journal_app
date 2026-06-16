package handler

import (
	"errors"
	"net/http"
	"strconv"

	"journal_app/internal/service"

	"github.com/gin-gonic/gin"
)

type TagHandler struct {
	tagService *service.TagService
}

func NewTagHandler(tagService *service.TagService) *TagHandler {
	return &TagHandler{tagService: tagService}
}

type createTagRequest struct {
	Name string `json:"name" form:"name"`
}

func (h *TagHandler) CreateTag(ctx *gin.Context) {
	var req createTagRequest

	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	tag, err := h.tagService.CreateTag(ctx, req.Name)
	if err != nil {
		if errors.Is(err, service.ErrTagNameRequired) {
			ctx.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to create tag", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"message": "tag created successfully", "tag": tag})
}

func (h *TagHandler) ListTags(ctx *gin.Context) {
	tags, err := h.tagService.ListTags(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to list tags", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"tags": tags})
}

func (h *TagHandler) DeleteTag(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid tag ID"})
		return
	}

	if err := h.tagService.DeleteTag(ctx, int32(id)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to delete tag", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "tag deleted successfully"})
}

type addTagToJournalRequest struct {
	TagID int32 `json:"tag_id" form:"tag_id"`
}

func (h *TagHandler) AddTagToJournal(ctx *gin.Context) {
	idStr := ctx.Param("id")
	journalID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	var req addTagToJournalRequest
	if err := ctx.ShouldBind(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid request body"})
		return
	}

	if req.TagID <= 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "tag_id is required"})
		return
	}

	if err := h.tagService.AddTagToJournal(ctx, int32(journalID), req.TagID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to add tag to journal", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "tag added to journal successfully"})
}

func (h *TagHandler) RemoveTagFromJournal(ctx *gin.Context) {
	journalIDStr := ctx.Param("id")
	tagIDStr := ctx.Param("tagId")

	journalID, err := strconv.ParseInt(journalIDStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	tagID, err := strconv.ParseInt(tagIDStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid tag ID"})
		return
	}

	if err := h.tagService.RemoveTagFromJournal(ctx, int32(journalID), int32(tagID)); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to remove tag from journal", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "tag removed from journal successfully"})
}

func (h *TagHandler) GetTagsByJournal(ctx *gin.Context) {
	idStr := ctx.Param("id")
	journalID, err := strconv.ParseInt(idStr, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "invalid journal ID"})
		return
	}

	tags, err := h.tagService.GetTagsByJournal(ctx, int32(journalID))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"message": "failed to get tags", "error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"tags": tags})
}
