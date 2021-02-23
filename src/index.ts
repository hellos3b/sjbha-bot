import "module-alias/register";

// Load services
import "@app/bastion";
import "@app/mongodb";
import "@app/express";

// Load plugins
import "@plugins/aqi";
// import "@plugins/christmas";
import "@plugins/fit";
import "@plugins/ping";
// import "@plugins/subscribe";