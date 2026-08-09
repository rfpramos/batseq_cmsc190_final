import React, { useState } from 'react';
import axios from 'axios';

import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';

import BlastLogo from '../assets/images/blast_logo.png';
import { useTheme } from '@mui/material/styles';
import '../App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BlastSearch = () => {
  const theme = useTheme();

  const [sequence, setSequence] = useState('');
  const [results, setResults] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subtitleExpanded, setSubtitleExpanded] = useState(false);

  // Track which BLAST result rows have expanded metadata
  const [expandedRows, setExpandedRows] = useState({});

  /*
   * User-friendly names for the API fields.
   */
  const columnLabels = {
    qseqid: 'Query Sequence ID',
    querySequenceId: 'Query Sequence ID',
    stitle: 'Match Details',
    matchedSequence: 'Match Details',
    pident: 'Sequence Identity (%)',
    percentIdentity: 'Sequence Identity (%)',
    length: 'Alignment Length',
    alignmentLength: 'Alignment Length',
    mismatch: 'Mismatches',
    mismatchCount: 'Mismatches',
    gapopen: 'Gap Openings',
    gapOpenings: 'Gap Openings',
    evalue: 'E-value',
    eValue: 'E-value',
    bitscore: 'Bit Score',
    bitScore: 'Bit Score',
  };

  /*
   * Optional descriptions for table headers.
   */
  const columnDescriptions = {
    querySequenceId:
      'Identifier of the nucleotide sequence submitted to BLAST.',

    matchedSequence:
      'Metadata describing the biological source and identity of the matched sequence.',

    percentIdentity:
      'Percentage of identical nucleotides between the query and matched sequence.',

    alignmentLength:
      'Number of nucleotides included in the alignment.',

    mismatchCount:
      'Number of nucleotide positions that do not match.',

    gapOpenings:
      'Number of gaps introduced into the alignment.',

    eValue:
      'Expected number of matches of similar quality that could occur by chance.',

    bitScore:
      'Normalized alignment score indicating the quality of the sequence match.',
  };

  /*
   * Metadata labels extracted from the BLAST subject title.
   *
   * Expected BLAST title:
   *
   * B1I1 |
   * Bat fecal pellet |
   * Rhinolophus rufus |
   * Cavinti Underground River and Cave Complex, Cavinti, Laguna |
   * Gram-negative |
   * Rod-shaped |
   * Facultative anaerobe |
   * Oxidase-negative |
   * Non-endospore-forming |
   * Escherichia coli |
   * Potentially pathogenic to humans |
   */
  const metadataLabels = [
    'Isolate Code',
    'Type of Sample',
    'Bat Source',
    'Sampling Site',
    'Gram reaction',
    'Cell shape',
    'Oxygen requirement',
    'Presence of cytochrome c oxidase',
    'Endospore-forming capability',
    'Identity',
    'Pathogenicity',
  ];

  /*
   * Toggle metadata visibility for a specific result row.
   */
  const toggleRow = (index) => {
    setExpandedRows((previous) => ({
      ...previous,
      [index]: !previous[index],
    }));
  };

  const handleChange = (e) => {
    setSequence(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!sequence.trim()) {
      setError('Please enter a 16S rRNA sequence.');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setColumns([]);
    setExpandedRows({});

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/blastn`,
        { sequence }
      );

      console.log('BLAST Response:', response.data);

      /*
       * Backend returns:
       *
       * {
       *   columns: [...],
       *   rows: [...]
       * }
       */

      const data = response.data;

      if (data && Array.isArray(data.rows)) {
        setColumns(
          Array.isArray(data.columns)
            ? data.columns
            : []
        );

        setResults(data.rows);
      } else {
        setResults([]);
        setColumns([]);
      }
    } catch (err) {
      console.error('BLAST request failed:', err);

      setError(
        err.response?.data?.error ||
          err.message ||
          'Failed to execute BLAST search.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Format numerical BLAST values.
   */
  const formatValue = (column, value) => {
    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {
      return '—';
    }

    switch (column) {
      case 'percentIdentity':
        return `${Number(value).toFixed(2)}%`;

      case 'alignmentLength':
      case 'mismatchCount':
      case 'gapOpenings':
        return Number(value).toLocaleString();

      case 'eValue':
        return Number(value).toExponential(2);

      case 'bitScore':
        return Number(value).toFixed(0);

      default:
        return String(value);
    }
  };

  /*
   * Parse the BLAST subject title into metadata.
   */
  const parseMatchedSequence = (value) => {
    if (!value) {
      return [];
    }

    const parts = String(value)
      .split('|')
      .map((part) => part.trim());

    return metadataLabels.map((label, index) => ({
      label,
      value: parts[index] || '',
    }));
  };

  /*
   * Format the metadata value to make it more readable.
   */
  const formatMetadataValue = (label, value) => {
    if (!value) {
      return '—';
    }

    switch (label) {
      case 'Gram reaction':
      case 'Presence of cytochrome c oxidase':
        return value
          .replace(/gram-negative/i, 'Gram-Negative')
          .replace(/gram-positive/i, 'Gram-Positive')
          .replace(/oxidase-negative/i, 'Oxidase-Negative')
          .replace(/oxidase-positive/i, 'Oxidase-Positive');

      default:
        return value;
    }
  };

  /*
   * Render the matched sequence metadata.
   */
  const renderMatchDetails = (value, rowIndex) => {
    const metadata = parseMatchedSequence(value);

    if (!metadata.length) {
      return '—';
    }

    const isExpanded = expandedRows[rowIndex];

    /*
     * Compact display:
     * Show isolate code and identity before expansion.
     */
    if (!isExpanded) {
      const isolateCode = metadata[0]?.value || 'Unknown isolate';
      const identity = metadata[9]?.value || 'Unknown identity';

      return (
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              mb: 0.3,
            }}
          >
            {isolateCode}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontSize: '0.85rem',
            }}
          >
            {identity}
          </Typography>

          <Typography
            component="button"
            type="button"
            onClick={() => toggleRow(rowIndex)}
            sx={{
              border: 'none',
              background: 'none',
              padding: 0,
              marginTop: 0.8,
              color: 'primary.main',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            See more
          </Typography>
        </Box>
      );
    }

    /*
     * Expanded display:
     * Key-value metadata table.
     */
    return (
      <Box sx={{ minWidth: 500 }}>
        <Table
          size="small"
          sx={{
            '& td': {
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <TableBody>
            {metadata.map((item, index) => (
              <TableRow key={index}>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    width: '42%',
                    verticalAlign: 'top',
                    fontSize: '0.8rem',
                    py: 0.8,
                  }}
                >
                  {item.label}
                </TableCell>

                <TableCell
                  sx={{
                    verticalAlign: 'top',
                    fontSize: '0.8rem',
                    py: 0.8,
                    wordBreak: 'break-word',
                  }}
                >
                  {formatMetadataValue(
                    item.label,
                    item.value
                  )}
                </TableCell>
              </TableRow>
            ))}

            <TableRow>
              <TableCell
                colSpan={2}
                sx={{
                  borderBottom: 'none',
                  textAlign: 'right',
                  pt: 1,
                }}
              >
                <Typography
                  component="button"
                  type="button"
                  onClick={() => toggleRow(rowIndex)}
                  sx={{
                    border: 'none',
                    background: 'none',
                    padding: 0,
                    color: 'primary.main',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                  }}
                >
                  See less
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    );
  };

  const hasResults = Array.isArray(results);

  /*
   * Fields that should actually be shown in the main BLAST table.
   *
   * qseqid is intentionally hidden because it usually contains
   * only "query".
   */
  const visibleColumns = columns.filter(
    (column) =>
      column !== 'querySequenceId' &&
      column !== 'qseqid'
  );

  return (
    <Container
      id="blaster"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
      }}
    >
      <img
        src={BlastLogo}
        alt="BLAST Logo"
        style={{
          width: '100%',
          maxWidth: '900px',
        }}
      />

      <Box sx={{ width: '100%' }}>

        {/* Description */}
        <Typography component="p" sx={{ mb: 1 }}>
          {subtitleExpanded
            ? 'Enter a 16S rRNA sequence in FASTA format to search for similar sequences. This tool performs a BLAST search against configured databases and returns aligned hits, scores, and metadata to help identify close relatives.'
            : 'Enter a 16S rRNA sequence in FASTA format to search for similar sequences.'}

          <Box
            component="span"
            sx={{
              ml: 1,
              color: 'primary.main',
              cursor: 'pointer',
              fontWeight: 700,
            }}
            onClick={() =>
              setSubtitleExpanded(!subtitleExpanded)
            }
          >
            {subtitleExpanded
              ? 'See less'
              : 'See more'}
          </Box>
        </Typography>

        {/* Search form */}
        <form onSubmit={handleSubmit}>
          <textarea
            value={sequence}
            onChange={handleChange}
            rows="10"
            placeholder="Enter 16S rRNA sequence in FASTA format"
            style={{
              color:
                theme.palette.mode === 'dark'
                  ? 'white'
                  : theme.palette.text.primary,

              width: '100%',
              borderRadius: '10px',
              backgroundColor: 'transparent',
              border: '1px solid #ccc',
              padding: '10px',
              resize: 'vertical',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />

          <br />

          <button
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#66bb6a',
              color: 'white',
              marginTop: '10px',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '10px',
              cursor: loading
                ? 'not-allowed'
                : 'pointer',
              fontWeight: 'bold',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading
              ? 'Searching...'
              : 'Search'}
          </button>
        </form>

        {/* Error */}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 3 }}
          >
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              mt: 4,
            }}
          >
            <CircularProgress
              size={24}
              sx={{ color: '#66bb6a' }}
            />

            <Typography>
              Searching BLAST database...
            </Typography>
          </Box>
        )}

        {/* Results */}
        {hasResults && !loading && (
          <>
            <Typography
              component="h1"
              variant="h4"
              sx={{
                color: '#66bb6a',
                fontWeight: 500,
                textAlign: 'center',
                mt: 5,
                mb: 1,
              }}
            >
              Sequence of Matched Hits
            </Typography>

            <Typography
              variant="body2"
              sx={{
                textAlign: 'center',
                color: 'text.secondary',
                mb: 2,
              }}
            >
              {results.length} matching sequence
              {results.length !== 1
                ? 's'
                : ''}{' '}
              found
            </Typography>

            {/* Results table */}
            {results.length > 0 ? (
              <TableContainer
                component={Paper}
                elevation={3}
                sx={{
                  mt: 2,
                  maxHeight: '70vh',
                  borderRadius: 3,
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Table
                  stickyHeader
                  size="small"
                  sx={{
                    width: '100%',
                    minWidth: 900,
                  }}
                >
                  {/* Table header */}
                  <TableHead>
                    <TableRow>
                      {visibleColumns.map(
                        (column) => (
                          <TableCell
                            key={column}
                            sx={{
                              fontWeight: 700,
                              backgroundColor:
                                'background.paper',
                              whiteSpace:
                                column ===
                                'matchedSequence'
                                  ? 'normal'
                                  : 'nowrap',
                              minWidth:
                                column ===
                                'matchedSequence'
                                  ? 320
                                  : 'auto',
                            }}
                          >
                            <Tooltip
                              title={
                                columnDescriptions[
                                  column
                                ] || column
                              }
                              arrow
                            >
                              <span>
                                {columnLabels[
                                  column
                                ] || column}
                              </span>
                            </Tooltip>
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  </TableHead>

                  {/* Table body */}
                  <TableBody>
                    {results.map(
                      (row, index) => (
                        <TableRow
                          key={index}
                          hover
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor:
                                'action.hover',
                            },

                            '& td': {
                              borderBottomColor:
                                'divider',
                            },
                          }}
                        >
                          {visibleColumns.map(
                            (column) => (
                              <TableCell
                                key={column}
                                sx={{
                                  fontSize:
                                    '0.875rem',
                                  verticalAlign:
                                    'top',
                                  whiteSpace:
                                    column ===
                                    'matchedSequence'
                                      ? 'normal'
                                      : 'nowrap',
                                  wordBreak:
                                    column ===
                                    'matchedSequence'
                                      ? 'break-word'
                                      : 'normal',
                                  py:
                                    column ===
                                    'matchedSequence'
                                      ? 1.5
                                      : 1,
                                }}
                              >
                                {column ===
                                'matchedSequence'
                                  ? renderMatchDetails(
                                      row[column],
                                      index
                                    )
                                  : formatValue(
                                      column,
                                      row[column]
                                    )}
                              </TableCell>
                            )
                          )}
                        </TableRow>
                      )
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Paper
                elevation={2}
                sx={{
                  mt: 3,
                  p: 4,
                  textAlign: 'center',
                  borderRadius: 3,
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                >
                  No Matching Sequences Found
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  BLAST did not identify any
                  significant matches for the
                  submitted sequence.
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default BlastSearch;