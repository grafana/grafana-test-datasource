package plugin

import (
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/resource/httpadapter"
)

func newResourceHandler() backend.CallResourceHandler {
	mux := http.NewServeMux()
	mux.HandleFunc("/namespaces", handleNamespaces)
	mux.HandleFunc("/projects", handleProjects)

	return httpadapter.New(mux)
}

func handleNamespaces(rw http.ResponseWriter, req *http.Request) {
	rw.Header().Add("Content-Type", "application/json")
	_, err := rw.Write([]byte(`{ "namespaces": ["ns-1", "ns-2"] }`))
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}

func handleProjects(rw http.ResponseWriter, req *http.Request) {
	rw.Header().Add("Content-Type", "application/json")
	_, err := rw.Write([]byte(`{ "projects": ["project-1", "project-2"] }`))
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}
