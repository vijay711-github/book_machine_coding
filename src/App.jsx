import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [books, setBooks] = useState(() => {
    const savedBooks = localStorage.getItem('books');
    return savedBooks ? JSON.parse(savedBooks) : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    publishedDate: '',
    publisher: '',
    email: '',
    age: '',
    image: ''
  });
  const [errors, setErrors] = useState({});
  const [editingBook, setEditingBook] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const response = await fetch('https://www.dbooks.org/api/recent');
        const data = await response.json();
        if (data.status === 'ok') {
          const apiBooks = data.books.map(book => ({
            title: book.title,
            author: book.authors,
            publishedDate: '',
            publisher: '',
            id: `api-${book.id}`,
            subtitle: book.subtitle,
            image: book.image,
            url: book.url
          }));

          setBooks(prevBooks => {
            const localBooks = prevBooks.filter(book => !book.id.startsWith('api-'));
            return [...localBooks, ...apiBooks];
          });
        }
      } catch (err) {
        setError('Failed to fetch books');
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    localStorage.setItem('books', JSON.stringify(books));
  }, [books]);

  const validateForm = () => {
    let tempErrors = {};
    tempErrors.title = newBook.title ? '' : 'Title is required';
    tempErrors.author = newBook.author ? '' : 'Author is required';
    tempErrors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newBook.email) ? '' : 'Invalid email format';
    tempErrors.age = !isNaN(newBook.age) && newBook.age > 0 ? '' : 'Age must be a positive number';

    setErrors(tempErrors);
    return Object.values(tempErrors).every(x => x === '');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBook(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please upload an image file' }));
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setNewBook(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      if (editingBook) {
        const updatedBooks = books.map(book =>
          book.id === editingBook.id ? {
            ...newBook,
            id: book.id,
            image: newBook.image || book.image
          } : book
        );
        setBooks(updatedBooks);
        setEditingBook(null);
      } else {
        const newBookWithId = {
          ...newBook,
          id: `local-${Date.now()}`,
          subtitle: '',
          image: newBook.image || 'https://placeholder.com/150',
          url: '#'
        };
        setBooks(prevBooks => [...prevBooks, newBookWithId]);
      }
      setNewBook({
        title: '',
        author: '',
        publishedDate: '',
        publisher: '',
        email: '',
        age: '',
        image: ''
      });
      setImagePreview(null);
      setErrors({});
    }
  };

  const handleDelete = (bookId) => {
    if (bookId.startsWith('api-')) {
      alert('Cannot delete books from the API');
      return;
    }

    if (window.confirm('Are you sure you want to delete this book?')) {
      setBooks(books.filter(book => book.id !== bookId));
    }
  };

  const handleEdit = (book) => {
    if (book.id.startsWith('api-')) {
      alert('Cannot edit books from the API');
      return;
    }

    setEditingBook(book);
    setNewBook({
      title: book.title,
      author: book.author,
      publishedDate: book.publishedDate || '',
      publisher: book.publisher || '',
      email: book.email || '',
      age: book.age || '',
      image: book.image || ''
    });
    setImagePreview(book.image || null);
  };

  return (
    <div className="App">
      <h1>Book Inventory Management System</h1>

      <div className="book-form">
        <h2>{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="title"
              placeholder="Book Title"
              value={newBook.title}
              onChange={handleInputChange}
            />
            {errors.title && <span className="error">{errors.title}</span>}
          </div>

          <div className="input-group">
            <input
              type="text"
              name="author"
              placeholder="Author"
              value={newBook.author}
              onChange={handleInputChange}
            />
            {errors.author && <span className="error">{errors.author}</span>}
          </div>

          <div className="input-group">
            <input
              type="date"
              name="publishedDate"
              placeholder="Published Date"
              value={newBook.publishedDate}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="publisher"
              placeholder="Publisher"
              value={newBook.publisher}
              onChange={handleInputChange}
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Contact Email"
              value={newBook.email}
              onChange={handleInputChange}
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="input-group">
            <input
              type="number"
              name="age"
              placeholder="Age Rating"
              value={newBook.age}
              onChange={handleInputChange}
            />
            {errors.age && <span className="error">{errors.age}</span>}
          </div>

          <div className="image-upload-container">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="image-input"
            />
            {errors.image && <span className="error">{errors.image}</span>}
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="button-group">
            <button type="submit" className="primary-button">
              {editingBook ? 'Update Book' : 'Add Book'}
            </button>
            {editingBook && (
              <button 
                type="button" 
                className="secondary-button"
                onClick={() => {
                  setEditingBook(null);
                  setNewBook({
                    title: '',
                    author: '',
                    publishedDate: '',
                    publisher: '',
                    email: '',
                    age: '',
                    image: ''
                  });
                  setImagePreview(null);
                  setErrors({});
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="book-table-container">
        <h2>Book Inventory</h2>
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Author</th>
                  <th>Published Date</th>
                  <th>Publisher</th>
                  <th>Age Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>
                      <img
                        src={book.image}
                        alt={book.title}
                        className="book-cover"
                      />
                    </td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td>{book.publishedDate}</td>
                    <td>{book.publisher}</td>
                    <td>{book.age}</td>
                    <td className="action-buttons">
                      <button 
                        onClick={() => window.open(book.url, '_blank')}
                        className="view-button"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEdit(book)}
                        className="edit-button"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(book.id)}
                        className="delete-button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;