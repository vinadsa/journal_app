package middleware

import (
	"log/slog"
	"time"

	"github.com/gin-gonic/gin"
)

// StructuredLogger returns a Gin middleware that logs every HTTP request
// using Go's structured slog logger. In production (JSON handler),
// this produces machine-parseable access logs suitable for aggregation
// into Datadog, Grafana Loki, or CloudWatch.
//
// Example JSON output:
//
//	{"level":"INFO","time":"2026-09-09T18:50:00Z","msg":"HTTP Request",
//	 "method":"GET","path":"/journals","status":200,"latency_ms":8.2,
//	 "client_ip":"192.168.1.1","user_id":"5"}
func StructuredLogger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path
		if c.Request.URL.RawQuery != "" {
			path = path + "?" + c.Request.URL.RawQuery
		}

		// Process the request
		c.Next()

		latency := time.Since(start)
		statusCode := c.Writer.Status()

		attrs := []slog.Attr{
			slog.String("method", c.Request.Method),
			slog.String("path", path),
			slog.Int("status", statusCode),
			slog.Float64("latency_ms", float64(latency.Microseconds())/1000.0),
			slog.String("client_ip", c.ClientIP()),
			slog.Int("body_size", c.Writer.Size()),
		}

		// Include user_id if the request was authenticated
		// (set by RequireAuth middleware via c.Set("user_id", ...))
		if userID := c.GetString("user_id"); userID != "" {
			attrs = append(attrs, slog.String("user_id", userID))
		}

		// Include error message if the handler recorded one
		if len(c.Errors) > 0 {
			attrs = append(attrs, slog.String("error", c.Errors.String()))
		}

		// Log level based on status code
		level := slog.LevelInfo
		if statusCode >= 500 {
			level = slog.LevelError
		} else if statusCode >= 400 {
			level = slog.LevelWarn
		}

		slog.LogAttrs(c.Request.Context(), level, "HTTP Request", attrs...)
	}
}
