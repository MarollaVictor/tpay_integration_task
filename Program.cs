using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container

// Register HttpClient for API calls
builder.Services.AddHttpClient();

// Configuration is automatically loaded from appsettings.json
// No need to add it explicitly - it's already available via IConfiguration

// Add MVC controllers with views support
builder.Services.AddControllersWithViews();

// Add CORS if needed (optional)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

// Disable HTTPS redirection for development
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseRouting();

// Use CORS (if added above)
app.UseCors("AllowAll");

app.UseAuthorization();

// Map controller routes
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapStaticAssets();

app.Run();