import React, { useState } from 'react';
import axios from 'axios';

import {
  Container,
  Typography,
  Paper,
  Button,
  Chip,
  Stack,
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
import { alpha, useTheme } from '@mui/material/styles';
import '../App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BlastSearch = () => {
  const theme = useTheme();
  const isolateCardGradient = 'linear-gradient(45deg, #00e676, #76ff03)';

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

  const resultCount = Array.isArray(results) ? results.length : 0;

  return (
    <Container
      id="blaster"
      sx={{
        mt: { xs: 8, sm: 10 },
        pt: { xs: 6, sm: 10 },
        pb: { xs: 8, sm: 16 },
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: { xs: 3, sm: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Box sx={{ width: '100%' }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 5,
            overflow: 'hidden',
            position: 'relative',
            background: `linear-gradient(135deg, ${alpha('#166534', 0.96)} 0%, ${alpha('#16a34a', 0.93)} 48%, ${alpha('#84cc16', 0.9)} 100%)`,
            color: 'common.white',
            boxShadow: '0 24px 64px rgba(22, 101, 52, 0.22)',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top right, rgba(255,255,255,0.22), transparent 36%)',
              pointerEvents: 'none',
            }}
          />
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={{ xs: 3, lg: 4 }}
            alignItems={{ xs: 'flex-start', lg: 'center' }}
            sx={{ position: 'relative' }}
          >
            <Box sx={{ flex: 1, width: '100%' }}>
              <Box
                component="img"
                src={BlastLogo}
                alt="BLAST Logo"
                sx={{
                  width: '100%',
                  maxWidth: 360,
                  mb: 2,
                  filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.18))',
                }}
              />

              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                <Chip
                  label="16S rRNA Search"
                  sx={{
                    color: 'common.white',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <Chip
                  label="Metadata-Aware Matches"
                  sx={{
                    color: 'common.white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                  }}
                />
              </Stack>

              <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.05, mb: 1.5 }}>
                Run a nucleotide similarity search against your curated dataset
              </Typography>

              <Typography component="p" sx={{ maxWidth: 760, color: 'rgba(255,255,255,0.88)', lineHeight: 1.7 }}>
                {subtitleExpanded
                  ? 'Enter a 16S rRNA sequence in FASTA format to search for similar sequences. This tool performs a BLAST search against configured databases and returns aligned hits, scores, and metadata to help identify close relatives.'
                  : 'Enter a 16S rRNA sequence in FASTA format to search for similar sequences.'}

                <Box
                  component="span"
                  sx={{
                    ml: 1,
                    color: 'rgba(255,255,255,0.95)',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
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
            </Box>

            <Paper
              elevation={0}
              sx={{
                width: '100%',
                maxWidth: 420,
                p: 2.5,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                backdropFilter: 'blur(18px)',
              }}
            >
              <Typography variant="overline" sx={{ letterSpacing: 1.1, color: 'rgba(255,255,255,0.75)' }}>
                Query Input
              </Typography>

              <form onSubmit={handleSubmit}>
                <Box
                  component="textarea"
                  value={sequence}
                  onChange={handleChange}
                  rows="10"
                  placeholder="Enter 16S rRNA sequence in FASTA format"
                  sx={{
                    mt: 1,
                    width: '100%',
                    resize: 'vertical',
                    borderRadius: 3,
                    border: '1px solid rgba(255,255,255,0.22)',
                    bgcolor: 'rgba(7, 18, 10, 0.28)',
                    color: 'common.white',
                    p: 1.5,
                    fontFamily: 'Consolas, Monaco, monospace',
                    fontSize: '0.95rem',
                    lineHeight: 1.5,
                    boxSizing: 'border-box',
                    outline: 'none',
                    '&::placeholder': {
                      color: 'rgba(255,255,255,0.55)',
                    },
                    '&:focus': {
                      borderColor: 'rgba(255,255,255,0.7)',
                      boxShadow: '0 0 0 3px rgba(255,255,255,0.12)',
                    },
                  }}
                />

                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1.5, mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                    FASTA input supported
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.72)' }}>
                    Secure local search
                  </Typography>
                </Stack>

                <Button
                  type="submit"
                  disabled={loading}
                  fullWidth
                  variant="contained"
                  sx={{
                    py: 1.2,
                    borderRadius: 999,
                    fontWeight: 800,
                    letterSpacing: 0.3,
                    textTransform: 'none',
                    color: '#14532d',
                    bgcolor: '#f0fdf4',
                    boxShadow: '0 12px 28px rgba(0,0,0,0.18)',
                    '&:hover': {
                      bgcolor: '#dcfce7',
                    },
                  }}
                >
                  {loading ? 'Searching BLAST...' : 'Search Sequence'}
                </Button>
              </form>
            </Paper>
          </Stack>
        </Paper>

        {/* Error */}
        {error && (
          <Alert
            severity="error"
            sx={{ mt: 3, borderRadius: 3 }}
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
                color: '#15803d',
                fontWeight: 800,
                textAlign: 'left',
                mt: 5,
                mb: 1.5,
              }}
            >
              Sequence of Matched Hits
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ mb: 2.5 }}
            >
              <Chip
                label={`${resultCount} matching sequence${resultCount !== 1 ? 's' : ''} found`}
                sx={{
                  bgcolor: alpha('#16a34a', 0.12),
                  color: '#166534',
                  fontWeight: 700,
                  borderRadius: 2,
                }}
              />
              
            </Stack>

            {/* Results table */}
            {results.length > 0 ? (
              <TableContainer
                component={Paper}
                elevation={3}
                sx={{
                  mt: 2,
                  maxHeight: '70vh',
                  borderRadius: 4,
                  overflow: 'auto',
                  // background: isolateCardGradient,
                  border: '1px solid rgba(22, 101, 52, 0.2)',
                  boxShadow: '0 20px 48px rgba(22, 101, 52, 0.2)',
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
                    <TableRow
                      sx={{
                        '& th': {
                          
                          backgroundColor: 'background.paper',
                          color: 'text.primary',
                        },
                      }}
                    >
                      {visibleColumns.map(
                        (column) => (
                          <TableCell
                            key={column}
                            sx={{
                              fontWeight: 700,
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
                  background: isolateCardGradient,
                  color: '#123524',
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