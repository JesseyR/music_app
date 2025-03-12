from django.urls import path
from . import views
from .views import genre_list, genre_detail

urlpatterns = [
    path('play/<int:song_id>/', views.play_song, name='play_song'),
    path('play/history/', views.play_history, name='play_history'),
    path('like/song/<int:song_id>/', views.like_song, name='like_song'),
    path('like/album/<int:album_id>/', views.like_album, name='like_album'),
    path('like/playlist/<int:playlist_id>/', views.like_playlist, name='like_playlist'),
    path('liked/', views.liked_items, name='liked_items'),
    path('album/<int:album_id>/', views.album_detail, name='album_detail'),
    path('get/recommendations/', views.get_recommendations, name='get_recommendations'),
    path('new/releases/', views.new_releases, name='new_releases'),
    path('genre/', views.genre, name='genre'),
    path('artists/', views.artist_list, name='artists'),
    path('artists/<int:artist_id>/', views.artist_detail, name='artist_detail'),
    path('genre/list/', views.genre_list, name='genre_list'),
    path('genre/<slug:slug>/', views.genre_detail, name='genre_detail'),
    path('album/list/', views.album_list, name='album_list'),
    path('song/list/', views.song_list, name='song_list'),
    path('<int:song_id>/', views.song_detail, name='song_detail'),

]