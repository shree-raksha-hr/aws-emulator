import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

function S3Detail() {
    const { bucket_name } = useParams();
    const [bucket, setBucket] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBucket = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.get(`${API_BASE_URL}/s3/${bucket_name}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBucket(response.data);
            } catch (err) {
                setError('Failed to fetch bucket details');
            }
        };

        fetchBucket();
    }, [bucket_name, navigate]);

    const handleDelete = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE_URL}/s3/${bucket_name}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/dashboard');
        } catch (err) {
            setError('Failed to delete bucket');
        }
    };

    if (!bucket) return <div>Loading...</div>;

    return (
        <div>
            <h1>S3 Bucket Details</h1>
            {error && <p>{error}</p>}
            <p>Name: {bucket.name}</p>
            <p>Created At: {new Date(bucket.created_at).toLocaleString()}</p>
            <h2>Objects</h2>
            <ul>
                {bucket.objects.map(obj => (
                    <li key={obj.key}>
                        {obj.key} (Created: {new Date(obj.created_at).toLocaleString()})
                    </li>
                ))}
            </ul>
            <button onClick={handleDelete}>Delete Bucket</button>
            <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
    );
}

export default S3Detail;