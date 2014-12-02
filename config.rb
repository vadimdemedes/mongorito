compass_config do |config|
  config.output_style = :compact
end

set :css_dir, 'stylesheets'
set :js_dir, 'scripts'
set :images_dir, 'images'

set :markdown_engine, :redcarpet
set :markdown, fenced_code_blocks: true, smartypants: true, highlight: true, disable_indented_code_blocks: true
                
activate :syntax, line_numbers: true
activate :directory_indexes
activate :deploy do |deploy|
  deploy.method = :git
end

helpers do
  def guides
    sitemap.resources.select { |page| page.data["description"] }
  end
end

page '/', layout: 'index'
page '/guides*', layout: 'guides'

configure :development do
  activate :livereload
end

configure :build do
  activate :asset_hash
  activate :minify_css
end
