package plugin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/sdf/sfddsf/pkg/models"
)

// Make sure Datasource implements required interfaces. This is important to do
// since otherwise we will only get a not implemented error response from plugin in
// runtime. In this example datasource instance implements backend.QueryDataHandler,
// backend.CheckHealthHandler interfaces. Plugin should not implement all these
// interfaces - only those which are required for a particular task.
var (
	_ backend.QueryDataHandler      = (*Datasource)(nil)
	_ backend.CheckHealthHandler    = (*Datasource)(nil)
	_ instancemgmt.InstanceDisposer = (*Datasource)(nil)
	_ backend.CallResourceHandler   = (*Datasource)(nil)
)

// NewDatasource creates a new datasource instance.
func NewDatasource(_ context.Context, dis backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
	return &Datasource{
		CallResourceHandler: newResourceHandler(),
	}, nil
}

// Datasource is an example datasource which can respond to data queries, reports
// its health and has streaming skills.
type Datasource struct {
	backend.CallResourceHandler
}

// Dispose here tells plugin SDK that plugin wants to clean up resources when a new instance
// created. As soon as datasource settings change detected by SDK old datasource instance will
// be disposed and a new one will be created using NewSampleDatasource factory function.
func (d *Datasource) Dispose() {
	// Clean up datasource instance resources.
}

// QueryData handles multiple queries and returns multiple responses.
// req contains the queries []DataQuery (where each query contains RefID as a unique identifier).
// The QueryDataResponse contains a map of RefID to the response for each query, and each response
// contains Frames ([]*Frame).
func (d *Datasource) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	// create response struct
	response := backend.NewQueryDataResponse()

	// loop over queries and execute them individually.
	for _, q := range req.Queries {
		res := d.query(ctx, req.PluginContext, q)

		// save the response in a hashmap
		// based on with RefID as identifier
		response.Responses[q.RefID] = res
	}

	return response, nil
}

type queryModel struct {
	Constant  float32 `json:"constant,omitempty"`
	QueryText string  `json:"queryText,omitempty"`
}

func (d *Datasource) query(_ context.Context, pCtx backend.PluginContext, query backend.DataQuery) backend.DataResponse {
	var response backend.DataResponse

	// Unmarshal the JSON into our queryModel.
	var qm queryModel

	err := json.Unmarshal(query.JSON, &qm)
	if err != nil {
		return backend.ErrDataResponse(backend.StatusBadRequest, fmt.Sprintf("json unmarshal: %v", err.Error()))
	}

	// create data frame response.
	// For an overview on data frames and how grafana handles them:
	// https://grafana.com/developers/plugin-tools/introduction/data-frames
	frame := data.NewFrame("response")
	backend.Logger.Info("QueryText", "QueryText", qm.QueryText)
	if qm.QueryText == "error" {
		response.Error = fmt.Errorf("error occurred")
		return response
	} else if qm.QueryText == "variableQuery" {
		frame.Fields = append(frame.Fields,
			data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
			data.NewField("value", nil, []string{"A", "B"}),
		)
	} else if qm.QueryText == "annotationQuery" {
		frame.Fields = append(frame.Fields,
			data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
			data.NewField("value", nil, []string{"A", "B"}),
		)
	} else if qm.QueryText == "tableData" {
		frame.Fields = append(frame.Fields,
			data.NewField("time", nil, []time.Time{
				time.Date(2023, time.January, 1, 0, 0, 0, 0, time.UTC),
				time.Date(2023, time.February, 1, 0, 0, 0, 0, time.UTC),
				time.Date(2023, time.March, 1, 0, 0, 0, 0, time.UTC),
				time.Date(2023, time.April, 1, 0, 0, 0, 0, time.UTC),
				time.Date(2023, time.May, 1, 0, 0, 0, 0, time.UTC),
			}),
			data.NewField("temperature", nil, []float32{22.2, 26, 30, 32, 35}),
			data.NewField("humidity", nil, []float32{70, 2, 80, 85, 90}),
			data.NewField("environment", nil, []string{"Staging", "Test", "Production", "Development", "QA"}),
		)
	} else if qm.QueryText == "singleTableRow" {
		frame.Fields = append(frame.Fields,
			data.NewField("time", nil, []time.Time{
				time.Date(2023, time.January, 1, 0, 0, 0, 0, time.UTC),
			}),
			data.NewField("temperature", nil, []float32{22.2}),
			data.NewField("humidity", nil, []float32{70}),
			data.NewField("environment", nil, []string{"Staging"}),
		)
	} else {
		frame.Fields = append(frame.Fields,
			data.NewField("time", nil, []time.Time{query.TimeRange.From, query.TimeRange.To}),
			data.NewField("values", nil, []int64{10, 20}),
		)
	}

	// add the frames to the response.
	response.Frames = append(response.Frames, frame)

	return response
}

// CheckHealth handles health checks sent from Grafana to the plugin.
// The main use case for these health checks is the test button on the
// datasource configuration page which allows users to verify that
// a datasource is working as expected.
func (d *Datasource) CheckHealth(_ context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	res := &backend.CheckHealthResult{}
	config, err := models.LoadPluginSettings(*req.PluginContext.DataSourceInstanceSettings)

	backend.Logger.Info("config.Path", "config.Path", config.Path)
	if err != nil {
		res.Status = backend.HealthStatusError
		res.Message = "Unable to load settings"
		return res, nil
	}

	if config.Path == "" {
		res.Status = backend.HealthStatusError
		res.Message = "API key is missing"
		return res, nil
	}

	if config.Path == "error" {
		return nil, fmt.Errorf("internal server error")
	}

	return &backend.CheckHealthResult{
		Status:  backend.HealthStatusOk,
		Message: "Data source is working",
	}, nil
}

func (p *Datasource) handleNamespaces(rw http.ResponseWriter, req *http.Request) {
	rw.Header().Add("Content-Type", "application/json")
	_, err := rw.Write([]byte(`{ "namespaces": ["ns-1", "ns-2"] }`))
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}

func (p *Datasource) handleProjects(rw http.ResponseWriter, req *http.Request) {
	rw.Header().Add("Content-Type", "application/json")
	_, err := rw.Write([]byte(`{ "projects": ["project-1", "project-2"] }`))
	if err != nil {
		return
	}
	rw.WriteHeader(http.StatusOK)
}
