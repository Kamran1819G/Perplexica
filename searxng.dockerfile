FROM searxng/searxng:latest

# Copy SearXNG configuration files
COPY searxng/settings.yml /etc/searxng/settings.yml
COPY searxng/limiter.toml /etc/searxng/limiter.toml
COPY searxng/uwsgi.ini /etc/searxng/uwsgi.ini

# Set proper permissions
RUN chown -R searxng:searxng /etc/searxng

# Expose the default SearXNG port
EXPOSE 8080

# Use the default SearXNG entrypoint
CMD ["/usr/local/searxng/dockerfiles/docker-entrypoint.sh"] 