package main

import (
	"log"
	"github.com/gin-gonic/gin"
)

func main () {
	r := gin.Default()
	InitializeRoutes(r)
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("failed to run server %v", err)
	}
}