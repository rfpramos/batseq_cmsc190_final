import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography } from '@mui/material';
import Switch from '@mui/material/Switch';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import BlastLogo from '../assets/images/blast_logo.png';
import { useTheme } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import '../App.css';

const BlastSearch = () => {
  const theme = useTheme();
  const [sequence, setSequence] = useState('');
  const [results, setResults] = useState(null); // null until response
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  // compute displayable preview
  const displayResults = (() => {
    if (!results) return '';
    if (isExpanded) return Array.isArray(results) ? JSON.stringify(results, null, 2) : String(results);
    if (typeof results === 'string') return results.slice(0, 400);
    if (Array.isArray(results)) return JSON.stringify(results, null, 2).slice(0, 400);
    return '';
  })();

  const isArrayResults = Array.isArray(results);
  const resultHeaders = isArrayResults && results.length > 0 ? Object.keys(results[0]) : [];

  const handleChange = (e) => setSequence(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await axios.post('http://localhost:5000/api/blastn', { sequence });
      console.log("BLAST Response:", response.data);

      // Normalize response:
      // - server may return { results: [...] } or just [...] or a JSON string
      let res = response.data?.results ?? response.data;

      // If it's a string that contains JSON, try to parse it (common when server returns serialized string)
      if (typeof res === 'string') {
        try {
          const parsed = JSON.parse(res);
          res = parsed;
        } catch (parseErr) {
          // keep as plain string if not JSON
        }
      }

      // Some server code returns an object with { columns: [...], rows: [...] }
      // Normalize that shape into a simple array of row objects for our table renderer.
      if (res && typeof res === 'object' && Array.isArray(res.rows)) {
        res = res.rows;
      }

      setResults(res ?? '');
    } catch (err) {
      setError(err.response?.data?.error ?? err.message);
    } finally {
      setLoading(false);
    }
  };

  const label = { inputProps: { 'aria-label': 'Switch demo' } };

  return (
    <Container
      id="blaster"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: { xs: 3, sm: 6 },
      }}
    >
      <div>
        <img src={BlastLogo} alt="BLAST Logo" style={{ width: '100%' }} />
        <p>
          Enter a 16S rRNA sequence in FASTA format to search for similar sequences
          <Tooltip title=" BASIC LOCAL ALIGNMENT SEARCH TOOL Current Sp: Mesorhizobium sp.  | Uncultured bacterium clone  | Paenibacillus sabinae strain T27  | Bradyrhizobium sp. ">
            <IconButton>
              <InfoIcon />
            </IconButton>
          </Tooltip>
        </p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={sequence}
            onChange={handleChange}
            rows="10"
            cols="50"
            placeholder="Enter 16S rRNA sequence in FASTA format"
            style={{
              color: theme.palette.mode === 'dark' ? 'white' : theme.palette.text.primary,
              width: '100%',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              border: '1px solid #ccc',
              padding: '10px'
            }}
          />
          <br />
          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#66bb6a',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <p>{error}</p>}

        {/* Show results header when there is any result */}
        {results && (
          <Typography component="h2" variant="h4" color="text.primary">RESULTS</Typography>
        )}

        {/* Expand switch only when there's expandable content */}
        {(typeof results === 'string' ? results.length > 400 : Array.isArray(results) && results.length > 0) && (
          <FormGroup>
            <FormControlLabel control={<Switch {...label} checked={isExpanded} onChange={toggleExpand} />} label="See Expanded Results" />
          </FormGroup>
        )}

        <div>
          {results && (
            isArrayResults ? (
              // Table rendering when results is an array of objects
              <div style={{ overflow: 'auto', maxHeight: '60vh' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {resultHeaders.map((h) => (
                        <th key={h} style={{ borderBottom: '1px solid #ccc', textAlign: 'left', padding: '6px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                        {resultHeaders.map((h) => (
                          <td key={h} style={{ padding: '6px', fontFamily: 'monospace' }}>{String(row[h] ?? '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{displayResults}</pre>
            )
          )}
        </div>
      </div>
    </Container>
  );
};

export default BlastSearch;
