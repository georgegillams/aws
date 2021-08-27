# Redundancy

The following files can be removed in the future:
 - All ecosystem.config.js files **except redis**. The "neo" deploy process generates these on the fly now.
 - All ngnix config files - these can now be generated from data.
 - Deploy scripts - only the `neo` deploy script need remain once all projects have migrated.
