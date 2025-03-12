from django.urls import path
from . import views

app_name = 'playlists'

urlpatterns = [
    path('playlist_list', views.playlist_list, name='playlist_list'),
    path('playlist_create/', views.playlist_create, name='playlist_create'),
    path('<int:pk>/', views.playlist_detail, name='playlist_detail'),
    path('popular_playlists/', views.popular_playlists, name='popular_playlists'),
    path('api/add-to-playlist/', views.add_to_playlist, name='add-to-playlist'),
    path('<int:playlist_id>/remove_song/<int:song_id>/', views.remove_song, name='remove_song'),


    # Add other playlist-related URLs
]