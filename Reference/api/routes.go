package main

import (
	"github.com/gin-gonic/gin"
)

func InitializeRoutes(r *gin.Engine) {
	// ping for server health
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "pong",
		})
	})

	// routes for stock related API
	stock := r.Group("/stock")
	{
		stock.GET(":/symbol", getStockBySymbol)
		stock.GET(":/symbol/history", getStockHistory)
		stock.GET(":/symbol/indicator", getStockIndicator)
	}
}

func getStockBySymbol(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "stock details for symbol",
	})
}

func getStockHistory(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "stock history for symbol",
	})
}

func getStockIndicator(c *gin.Context) {
	c.JSON(200, gin.H{
		"message": "stock indicators for symbol",
	})
}