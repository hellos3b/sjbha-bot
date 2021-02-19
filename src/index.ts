import "module-alias/register";

// Load services
import "@app/bastion";
import "@app/mongodb";
import "@app/express";

// Load plugins
import "@plugins/ping";
import "@plugins/fit";
// import "@plugins/christmas";
// import "@plugins/subscribe";
// import "@plugins/aqi";